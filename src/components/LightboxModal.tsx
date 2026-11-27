import {
  ChevronLeft,
  ChevronRight,
  Download,
  Film,
  Info,
  Maximize2,
  Minimize2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  MouseEvent,
  PointerEvent,
  TouchEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ArtworkItem,
  computeLightboxImageMetrics,
  LIGHTBOX_MAX_ZOOM,
  LIGHTBOX_MIN_ZOOM,
  LightboxScaleMode,
  resolveFullResArtworkSrc,
  stepLightboxZoom,
} from '../utils/portfolioLogic.ts';

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
  const [showInfo, setShowInfo] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );
  const [scaleMode, setScaleMode] = useState<LightboxScaleMode>('original');
  const [customZoom, setCustomZoom] = useState(1);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({
    width: artwork?.width ?? 1,
    height: artwork?.height ?? 1,
  });
  const [stageSize, setStageSize] = useState<{ width: number; height: number }>({
    width: 960,
    height: 680,
  });
  const [isDragging, setIsDragging] = useState(false);

  const stageViewportRef = useRef<HTMLDivElement | null>(null);
  const wasOpenRef = useRef(false);
  const touchStartXRef = useRef<number | null>(null);
  const activeThumbRef = useRef<HTMLButtonElement | null>(null);
  const dragStateRef = useRef<{
    active: boolean;
    moved: boolean;
    startX: number;
    startY: number;
    scrollLeft: number;
    scrollTop: number;
  }>({
    active: false,
    moved: false,
    startX: 0,
    startY: 0,
    scrollLeft: 0,
    scrollTop: 0,
  });
  const suppressNextClickRef = useRef(false);

  // Sync info drawer default per viewport whenever modal transitions from closed to open
  useEffect(() => {
    const isOpen = Boolean(artwork);
    if (isOpen && !wasOpenRef.current && typeof window !== 'undefined') {
      setShowInfo(window.innerWidth >= 1024);
    }
    wasOpenRef.current = isOpen;
  }, [artwork]);

  // Reset resolution mode to 1:1 native original whenever switching artwork
  useEffect(() => {
    if (!artwork) return;
    setScaleMode('original');
    setCustomZoom(1);
    setNaturalSize({
      width: Math.max(1, artwork.width),
      height: Math.max(1, artwork.height),
    });
    if (stageViewportRef.current) {
      stageViewportRef.current.scrollLeft = 0;
      stageViewportRef.current.scrollTop = 0;
    }
  }, [artwork?.id, artwork?.width, artwork?.height]);

  // Measure the available stage viewport so Fit mode and overflow detection stay exact
  useEffect(() => {
    if (!artwork) return;
    const node = stageViewportRef.current;
    if (!node) return;

    const updateStageSize = () => {
      const style = window.getComputedStyle(node);
      const padX = parseFloat(style.paddingLeft || '0') + parseFloat(style.paddingRight || '0');
      const padY = parseFloat(style.paddingTop || '0') + parseFloat(style.paddingBottom || '0');
      const nextW = Math.max(120, Math.floor(node.clientWidth - padX));
      const nextH = Math.max(120, Math.floor(node.clientHeight - padY));
      setStageSize((prev) =>
        prev.width === nextW && prev.height === nextH ? prev : { width: nextW, height: nextH }
      );
    };

    updateStageSize();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(updateStageSize);
      observer.observe(node);
      return () => observer.disconnect();
    }

    window.addEventListener('resize', updateStageSize);
    return () => window.removeEventListener('resize', updateStageSize);
  }, [artwork, showInfo]);

  const metrics = useMemo(
    () =>
      computeLightboxImageMetrics({
        naturalWidth: naturalSize.width,
        naturalHeight: naturalSize.height,
        stageWidth: stageSize.width,
        stageHeight: stageSize.height,
        mode: scaleMode,
        customZoom,
      }),
    [naturalSize.width, naturalSize.height, stageSize.width, stageSize.height, scaleMode, customZoom]
  );

  const handleSetOriginalMode = useCallback(() => {
    setScaleMode('original');
    setCustomZoom(1);
  }, []);

  const handleSetFitMode = useCallback(() => {
    setScaleMode('fit');
  }, []);

  const handleStepZoom = useCallback(
    (direction: 'in' | 'out') => {
      const nextZoom = stepLightboxZoom(metrics.activeScale, direction);
      if (Math.abs(nextZoom - 1) < 0.005) {
        setScaleMode('original');
        setCustomZoom(1);
      } else {
        setScaleMode('custom');
        setCustomZoom(nextZoom);
      }
    },
    [metrics.activeScale]
  );

  const handleToggleFitOriginal = useCallback(() => {
    if (scaleMode === 'original') {
      setScaleMode('fit');
    } else {
      setScaleMode('original');
      setCustomZoom(1);
    }
  }, [scaleMode]);

  useEffect(() => {
    if (!artwork) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') onNext();
      if (event.key === 'ArrowLeft') onPrev();
      if (artwork.mediaType !== 'video') {
        if (event.key === '1' || event.key === '0') {
          handleSetOriginalMode();
        } else if (event.key === 'f' || event.key === 'F') {
          handleSetFitMode();
        } else if (event.key === '+' || event.key === '=') {
          handleStepZoom('in');
        } else if (event.key === '-' || event.key === '_') {
          handleStepZoom('out');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    artwork,
    onClose,
    onNext,
    onPrev,
    handleSetOriginalMode,
    handleSetFitMode,
    handleStepZoom,
  ]);

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
  const fullSrc = resolveFullResArtworkSrc(artwork);
  const downloadFilename = `${artwork.id}.${isVideo ? 'mp4' : fullSrc.split('.').pop()?.split('?')[0] || 'webp'}`;

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (!isVideo && metrics.overflowsStage) return;
    touchStartXRef.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (!isVideo && metrics.overflowsStage) return;
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

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (isVideo || event.button !== 0 || event.pointerType === 'touch') return;
    const el = stageViewportRef.current;
    if (!el) return;
    const canPan = el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1;
    if (!canPan) return;

    dragStateRef.current = {
      active: true,
      moved: false,
      startX: event.clientX,
      startY: event.clientY,
      scrollLeft: el.scrollLeft,
      scrollTop: el.scrollTop,
    };
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const state = dragStateRef.current;
    if (!state.active) return;
    const el = stageViewportRef.current;
    if (!el) return;
    const dx = event.clientX - state.startX;
    const dy = event.clientY - state.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      state.moved = true;
    }
    el.scrollLeft = state.scrollLeft - dx;
    el.scrollTop = state.scrollTop - dy;
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const state = dragStateRef.current;
    if (!state.active) return;
    if (state.moved) {
      suppressNextClickRef.current = true;
    }
    state.active = false;
    setIsDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleImageDoubleClick = (event: MouseEvent<HTMLImageElement>) => {
    event.stopPropagation();
    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false;
      return;
    }
    handleToggleFitOriginal();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Chi tiết tác phẩm ${artwork.title}`}
      className="fixed inset-0 z-50 bg-[#02050B]/98 flex flex-col text-[#F1F5F9] overflow-hidden"
      onClick={onClose}
    >
      {/* Top Studio Bar */}
      <div
        className="px-3 sm:px-6 min-h-14 py-2 border-b border-[#16243D] bg-[#040812]/95 flex flex-wrap items-center justify-between gap-2.5 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 text-xs sm:text-sm min-w-0 flex-1">
          <span className="font-mono tabular-nums text-[#38BDF8] font-medium shrink-0">
            {String(currentIndex + 1).padStart(2, '0')} / {String(totalCount).padStart(2, '0')}
          </span>
          <span aria-hidden="true" className="hidden sm:inline text-slate-600">
            ·
          </span>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-slate-200 truncate">
            {isVideo && <Film className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" aria-hidden="true" />}
            <span className="truncate font-medium">{artwork.title}</span>
          </span>
          {!isVideo && (
            <>
              <span aria-hidden="true" className="hidden md:inline text-slate-600">
                ·
              </span>
              <span
                data-testid="lightbox-resolution-readout"
                className="hidden sm:inline font-mono text-xs tabular-nums text-[#94A3B8] shrink-0"
              >
                {naturalSize.width}×{naturalSize.height} · {metrics.percentage}%
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap">
          {!isVideo && (
            <div
              role="group"
              aria-label="Điều khiển độ phân giải và thu phóng ảnh"
              className="inline-flex items-center rounded-lg border border-[#1B2D4B] bg-[#070D19] p-0.5"
            >
              <button
                type="button"
                onClick={handleSetOriginalMode}
                aria-pressed={scaleMode === 'original'}
                aria-label="Hiển thị ảnh gốc 1:1 đủ độ phân giải"
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  scaleMode === 'original'
                    ? 'bg-[#0284C7] text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Ảnh Gốc 1:1</span>
              </button>

              <button
                type="button"
                onClick={handleSetFitMode}
                aria-pressed={scaleMode === 'fit'}
                aria-label="Thu vừa khung hình"
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  scaleMode === 'fit'
                    ? 'bg-[#0E203C] text-[#38BDF8]'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Minimize2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Vừa Khung</span>
              </button>

              <span aria-hidden="true" className="h-4 w-px bg-[#1B2D4B] mx-0.5 hidden sm:block" />

              <button
                type="button"
                onClick={() => handleStepZoom('out')}
                disabled={metrics.activeScale <= LIGHTBOX_MIN_ZOOM + 0.01}
                aria-label="Thu nhỏ ảnh"
                className="hidden sm:inline-flex items-center justify-center w-7 h-7 rounded-md text-slate-300 hover:text-white hover:bg-[#101C33] disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
              >
                <ZoomOut className="w-3.5 h-3.5" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={handleSetOriginalMode}
                aria-label="Đặt lại tỷ lệ 100% ảnh gốc"
                className="hidden sm:inline-flex items-center justify-center min-w-[46px] px-1.5 h-7 rounded-md font-mono text-[11px] tabular-nums text-[#7DD3FC] hover:bg-[#101C33] cursor-pointer"
              >
                {metrics.percentage}%
              </button>

              <button
                type="button"
                onClick={() => handleStepZoom('in')}
                disabled={metrics.activeScale >= LIGHTBOX_MAX_ZOOM - 0.01}
                aria-label="Phóng to ảnh"
                className="hidden sm:inline-flex items-center justify-center w-7 h-7 rounded-md text-slate-300 hover:text-white hover:bg-[#101C33] disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
              >
                <ZoomIn className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          )}

          <a
            href={fullSrc}
            download={downloadFilename}
            aria-label={isVideo ? 'Tải video gốc' : 'Tải ảnh gốc độ phân giải đầy đủ'}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-[#1B2D4B] bg-[#070D19] hover:border-[#38BDF8]/50 text-slate-200 hover:text-white text-xs font-medium transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-[#38BDF8]" aria-hidden="true" />
            <span className="hidden md:inline">{isVideo ? 'Tải Video' : 'Tải Ảnh Gốc'}</span>
          </a>

          <button
            type="button"
            onClick={() => setShowInfo((prev) => !prev)}
            aria-pressed={showInfo}
            aria-label={showInfo ? 'Ẩn thông tin tác phẩm' : 'Hiện thông tin tác phẩm'}
            className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
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
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#0A162B] hover:bg-[#13294B] text-white border border-[#1E355A] text-xs font-medium transition-colors cursor-pointer"
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
          } relative bg-[#03060C] min-h-0 overflow-hidden`}
        >
          {/* Scrollable / Pannable Stage Viewport */}
          <div
            ref={stageViewportRef}
            data-testid="lightbox-stage-viewport"
            data-scale-mode={scaleMode}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className={`w-full h-full overflow-auto p-3 sm:p-6 flex ${
              !isVideo && metrics.overflowsStage
                ? isDragging
                  ? 'cursor-grabbing select-none'
                  : 'cursor-grab'
                : ''
            }`}
          >
            {isVideo ? (
              <div className="m-auto flex items-center justify-center max-w-full max-h-full">
                <video
                  key={artwork.src}
                  src={fullSrc}
                  poster={artwork.posterSrc}
                  controls
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  className="max-h-full max-w-full w-auto rounded-xl bg-black shadow-2xl"
                />
              </div>
            ) : (
              <div className="m-auto shrink-0 flex items-center justify-center">
                <img
                  key={fullSrc}
                  src={fullSrc}
                  alt={artwork.alt}
                  data-testid="lightbox-detail-image"
                  data-natural-width={naturalSize.width}
                  data-natural-height={naturalSize.height}
                  data-scale-mode={scaleMode}
                  width={metrics.renderWidth}
                  height={metrics.renderHeight}
                  loading="eager"
                  decoding="sync"
                  draggable={false}
                  referrerPolicy="no-referrer"
                  onLoad={(event) => {
                    const img = event.currentTarget;
                    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                      setNaturalSize({
                        width: img.naturalWidth,
                        height: img.naturalHeight,
                      });
                    }
                  }}
                  onDoubleClick={handleImageDoubleClick}
                  style={{
                    width: `${metrics.renderWidth}px`,
                    height: `${metrics.renderHeight}px`,
                    maxWidth: 'none',
                    maxHeight: 'none',
                  }}
                  className="block rounded-xl shadow-[0_24px_60px_-16px_rgba(0,0,0,0.85)] select-none"
                />
              </div>
            )}
          </div>

          {totalCount > 1 && (
            <>
              <button
                type="button"
                onClick={onPrev}
                aria-label="Tác phẩm trước"
                className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#05080F]/85 hover:bg-[#0284C7] text-white border border-white/15 flex items-center justify-center transition-colors cursor-pointer backdrop-blur-md z-10"
              >
                <ChevronLeft className="w-5 h-5" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={onNext}
                aria-label="Tác phẩm tiếp theo"
                className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#05080F]/85 hover:bg-[#0284C7] text-white border border-white/15 flex items-center justify-center transition-colors cursor-pointer backdrop-blur-md z-10"
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
              {!isVideo && (
                <div className="flex justify-between gap-4">
                  <dt className="text-[#94A3B8] shrink-0">Độ phân giải thực</dt>
                  <dd className="font-mono tabular-nums text-[#38BDF8] font-semibold text-right">
                    {naturalSize.width} × {naturalSize.height} px ({metrics.percentage}%)
                  </dd>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <dt className="text-[#94A3B8] shrink-0">Định dạng</dt>
                <dd className="font-mono tabular-nums text-[#F1F5F9] text-right">
                  {artwork.specs.format}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#94A3B8] shrink-0">Tối ưu hóa</dt>
                <dd className="font-mono tabular-nums text-[#38BDF8] text-right">
                  {artwork.specs.fileSize}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#94A3B8] shrink-0">Tỷ lệ</dt>
                <dd className="font-mono tabular-nums text-[#F1F5F9] text-right">
                  {artwork.specs.aspect}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#94A3B8] shrink-0">Ánh sáng</dt>
                <dd className="text-[#F1F5F9] text-right">{artwork.specs.lighting}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#94A3B8] shrink-0">Chủ đề</dt>
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
