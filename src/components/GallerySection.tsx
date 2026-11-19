import {
  ArrowLeft,
  BookOpen,
  Expand,
  Film,
  LayoutGrid,
  Moon,
  Play,
  Search,
  Sun,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { GALLERY_ARTWORKS } from '../data/portfolioData.ts';
import {
  ArtworkItem,
  GalleryCategory,
  getGalleryCategoryCounts,
  searchAndFilterGalleryItems,
  ThemeMode,
} from '../utils/portfolioLogic.ts';

interface GallerySectionProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  onSelectArtwork: (artwork: ArtworkItem, scopeList: ArtworkItem[]) => void;
  onBackToProfile: () => void;
}

type GalleryViewMode = 'masonry' | 'editorial';

export function GallerySection({
  theme,
  onToggleTheme,
  onSelectArtwork,
  onBackToProfile,
}: GallerySectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<GalleryCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<GalleryViewMode>('masonry');
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [inlinePlayingVideoId, setInlinePlayingVideoId] = useState<string | null>(null);

  const counts = useMemo(() => getGalleryCategoryCounts(GALLERY_ARTWORKS), []);

  const visibleArtworks = useMemo(
    () => searchAndFilterGalleryItems(GALLERY_ARTWORKS, selectedCategory, searchQuery),
    [selectedCategory, searchQuery]
  );

  const showVideoSpotlight =
    (selectedCategory === 'all' || selectedCategory === 'portrait') && searchQuery.trim() === '';

  const videoSpotlight = useMemo(
    () => (showVideoSpotlight ? visibleArtworks.find((item) => item.mediaType === 'video') : undefined),
    [showVideoSpotlight, visibleArtworks]
  );

  const gridArtworks = useMemo(() => {
    if (!videoSpotlight) return visibleArtworks;
    return visibleArtworks.filter((item) => item.id !== videoSpotlight.id);
  }, [visibleArtworks, videoSpotlight]);

  const filterTabs = useMemo(
    () =>
      (
        [
          { id: 'all', label: `Tất Cả (${counts.all})` },
          { id: 'imperial', label: `Cổ Phong & Nho Sĩ (${counts.imperial})` },
          { id: 'poetic', label: `Nàng Thơ Hoa Đào (${counts.poetic})` },
          { id: 'portrait', label: `Chân Dung & Video (${counts.portrait})` },
          { id: 'moments', label: `Đồng Đội & Kỷ Niệm (${counts.moments})` },
        ] as { id: GalleryCategory; label: string }[]
      ).filter((tab) => tab.id === 'all' || counts[tab.id] > 0),
    [counts]
  );

  const handleOpenSlideshow = () => {
    const firstItem = visibleArtworks[0] ?? GALLERY_ARTWORKS[0];
    if (firstItem) {
      onSelectArtwork(firstItem, visibleArtworks.length > 0 ? visibleArtworks : GALLERY_ARTWORKS);
    }
  };

  return (
    <section id="gallery" className="pt-8 sm:pt-12 pb-8 space-y-10">
      {/* Exhibition Header & Controls with Subtle Sakura Backdrop */}
      <div className="space-y-6 border-b border-[#DCE6F2] dark:border-[#182740] pb-8">
        <div className="relative rounded-3xl overflow-hidden border border-[#DCE6F2] dark:border-[#182740] bg-white/95 dark:bg-[#0B1220]/95 p-6 sm:p-8 lg:p-10 space-y-6 soft-card">
          {/* Atmospheric Background Artwork (strictly backdrop, never foreground focus) */}
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none select-none">
            <img
              src="/assets/gallery/nang-tho-hoa-dao.webp"
              alt=""
              loading="eager"
              decoding="sync"
              className="w-full h-full object-cover object-center opacity-[0.22] dark:opacity-[0.28]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-white/40 dark:from-[#0B1220] dark:via-[#0B1220]/88 dark:to-[#0B1220]/35" />
            <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-white/35 dark:from-[#0B1220]/85 dark:via-transparent dark:to-[#0B1220]/40" />
          </div>

          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                onBackToProfile();
              }}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-[#475569] dark:text-[#94A3B8] hover:text-[#0369A1] dark:hover:text-[#38BDF8] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span>Quay Lại Hồ Sơ Kỹ Sư</span>
            </a>

            <button
              id="theme-toggle-btn"
              type="button"
              onClick={onToggleTheme}
              aria-label="Chuyển đổi giao diện Sáng / Tối"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#DCE6F2] dark:border-[#1E3250] bg-white/90 dark:bg-[#0B1220]/90 text-xs font-medium text-[#070B14] dark:text-[#F1F5F9] hover:border-[#0284C7] dark:hover:border-[#38BDF8] transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {theme === 'dark' ? (
                <Moon className="w-3.5 h-3.5 text-[#38BDF8]" aria-hidden="true" />
              ) : (
                <Sun className="w-3.5 h-3.5 text-[#0284C7]" aria-hidden="true" />
              )}
              <span id="theme-text">{theme === 'dark' ? 'Nền Tối' : 'Nền Sáng'}</span>
            </button>
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <p className="text-xs sm:text-sm font-medium text-[#0369A1] dark:text-[#38BDF8] tracking-wide">
                Không Gian Trưng Bày Thị Giác · Thuận Lê
              </p>
              <h1 className="font-display font-semibold text-4xl sm:text-5xl tracking-[-0.02em] text-[#070B14] dark:text-[#F1F5F9] leading-[1.08] text-balance">
                Triển Lãm Ảnh, Video &amp; Kỷ Niệm Đời Thường
              </h1>
              <p className="text-sm sm:text-base text-[#475569] dark:text-[#94A3B8] leading-relaxed text-pretty">
                {counts.all} khoảnh khắc được tuyển chọn và nén chuẩn WebP / H.264 giữ trọn từng tỷ
                lệ khung hình gốc — từ mỹ học Á Đông, đêm lập trình Hà Nội đến những chuyến đi cùng
                đồng đội và người thương.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                id="start-slideshow-btn"
                type="button"
                onClick={handleOpenSlideshow}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0A192F] hover:bg-[#13294B] dark:bg-[#0284C7] dark:hover:bg-[#0369A1] text-white font-semibold text-sm shadow-[0_10px_24px_-8px_rgba(10,25,47,0.4)] dark:shadow-[0_10px_24px_-8px_rgba(2,132,199,0.5)] hover:-translate-y-0.5 transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Expand className="w-4 h-4" aria-hidden="true" />
                <span>Xem Toàn Màn Hình ({visibleArtworks.length})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Tabs + Instant Search + View Switcher */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3.5 pt-1">
          <div
            id="gallery-filters"
            role="tablist"
            aria-label="Lọc bộ sưu tập ảnh theo chủ đề"
            className="inline-flex flex-wrap items-center gap-1 p-1.5 rounded-xl bg-[#E8F0F9] dark:bg-[#0B1426] border border-[#DCE6F2] dark:border-[#182740]"
          >
            {filterTabs.map((tab) => {
              const isActive = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-white dark:bg-[#14233E] text-[#070B14] dark:text-[#F1F5F9] shadow-[0_2px_8px_-2px_rgba(10,25,47,0.12)]'
                      : 'text-[#475569] dark:text-[#94A3B8] hover:text-[#070B14] dark:hover:text-[#F1F5F9]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Instant Search */}
            <div className="relative flex-1 sm:w-72">
              <Search
                className="w-4 h-4 text-[#64748B] dark:text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="gallery-search-input"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Tìm kiếm ảnh theo tiêu đề hoặc kỷ niệm"
                placeholder="Tìm ảnh (hoa đào, MISA...)"
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-[#DCE6F2] dark:border-[#182740] bg-white/95 dark:bg-[#0B1220]/95 text-xs sm:text-sm text-[#070B14] dark:text-[#F1F5F9] placeholder:text-[#64748B] dark:placeholder:text-[#64748B] focus:outline-none focus:border-[#0284C7] dark:focus:border-[#38BDF8] transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Xóa từ khóa tìm kiếm"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-[#64748B] hover:text-[#070B14] dark:hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              )}
            </div>

            {/* Museum Grid vs Detailed Editorial View Switcher */}
            <div
              role="group"
              aria-label="Chế độ hiển thị phòng tranh"
              className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#E8F0F9] dark:bg-[#0B1426] border border-[#DCE6F2] dark:border-[#182740] shrink-0"
            >
              <button
                id="view-mode-masonry"
                type="button"
                aria-pressed={viewMode === 'masonry'}
                onClick={() => setViewMode('masonry')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap cursor-pointer ${
                  viewMode === 'masonry'
                    ? 'bg-white dark:bg-[#14233E] text-[#070B14] dark:text-[#F1F5F9] shadow-xs'
                    : 'text-[#475569] dark:text-[#94A3B8] hover:text-[#070B14] dark:hover:text-[#F1F5F9]'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Lưới Nghệ Thuật</span>
              </button>

              <button
                id="view-mode-editorial"
                type="button"
                aria-pressed={viewMode === 'editorial'}
                onClick={() => setViewMode('editorial')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap cursor-pointer ${
                  viewMode === 'editorial'
                    ? 'bg-white dark:bg-[#14233E] text-[#070B14] dark:text-[#F1F5F9] shadow-xs'
                    : 'text-[#475569] dark:text-[#94A3B8] hover:text-[#070B14] dark:hover:text-[#F1F5F9]'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Tạp Chí Chi Tiết</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Curated Spotlight Stage: Wide Coding Timelapse Cinema */}
      {videoSpotlight && (
        <div id="gallery-spotlight" className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-7">
          <figure
            id="timelapse-featured-stage"
            data-gallery-card="true"
            className="lg:col-span-12 soft-card rounded-3xl overflow-hidden border border-[#1B3358]/70 dark:border-[#1E355A] bg-gradient-to-br from-[#060E1D] via-[#05080F] to-[#081529] text-white grid grid-cols-1 lg:grid-cols-12 items-stretch"
          >
            {/* Spacious Cinema Video Viewport */}
            <div className="lg:col-span-7 relative min-h-[380px] sm:min-h-[470px] lg:min-h-[520px] bg-[#03060D] flex items-center justify-center overflow-hidden">
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(2,132,199,0.16),transparent_68%)] pointer-events-none"
              />

              {inlinePlayingVideoId === videoSpotlight.id ? (
                <video
                  src={videoSpotlight.src}
                  poster={videoSpotlight.posterSrc}
                  controls
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="relative z-10 w-full h-full max-h-[540px] object-contain bg-[#03060D]"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setInlinePlayingVideoId(videoSpotlight.id)}
                  aria-label={`Phát video ${videoSpotlight.title}`}
                  className="relative z-10 w-full h-full flex items-center justify-center group cursor-pointer overflow-hidden"
                >
                  <img
                    src={videoSpotlight.posterSrc || videoSpotlight.src}
                    alt={videoSpotlight.alt}
                    width={videoSpotlight.width}
                    height={videoSpotlight.height}
                    loading="eager"
                    decoding="sync"
                    className="w-full h-full max-h-[540px] object-cover object-[50%_58%] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#03060D]/80 via-[#03060D]/20 to-transparent flex flex-col items-center justify-center gap-3">
                    <span className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#0284C7]/92 hover:bg-[#0284C7] text-white border border-white/40 flex items-center justify-center shadow-[0_18px_40px_-8px_rgba(2,132,199,0.85)] transition-transform duration-200 group-hover:scale-105">
                      <Play className="w-7 h-7 ml-1" aria-hidden="true" />
                    </span>
                    <span className="text-xs sm:text-sm font-medium text-white/95 tracking-wide">
                      Nhấn để phát Video Timelapse 0:36
                    </span>
                  </div>
                </button>
              )}
            </div>

            {/* Generous Curatorial Studio Narrative Panel */}
            <figcaption className="lg:col-span-5 p-6 sm:p-9 lg:p-10 flex flex-col justify-between gap-6 border-t lg:border-t-0 lg:border-l border-[#182740]">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#38BDF8] font-medium">
                  <Film className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Không Gian Tâm Điểm · Video Timelapse</span>
                  <span aria-hidden="true" className="text-slate-500">
                    ·
                  </span>
                  <span className="font-mono tabular-nums text-slate-300">
                    {videoSpotlight.specs.aspect}
                  </span>
                </div>

                <div className="space-y-2">
                  <h2 className="font-display text-3xl sm:text-4xl font-semibold text-white leading-[1.12]">
                    <button
                      type="button"
                      onClick={() => onSelectArtwork(videoSpotlight, visibleArtworks)}
                      className="text-left hover:text-[#38BDF8] transition-colors cursor-pointer"
                    >
                      {videoSpotlight.title}
                    </button>
                  </h2>
                  <p className="text-xs sm:text-sm font-medium text-[#7DD3FC]">
                    {videoSpotlight.subtitle}
                  </p>
                </div>

                <p className="text-sm sm:text-base text-slate-300 leading-relaxed text-pretty">
                  {videoSpotlight.story}
                </p>
              </div>

              <div className="space-y-5 pt-4 border-t border-[#182740]">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                  <div>
                    <dt className="text-slate-400">Định dạng</dt>
                    <dd className="font-mono text-white mt-0.5">{videoSpotlight.specs.format}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Tối ưu hóa</dt>
                    <dd className="font-mono text-[#38BDF8] mt-0.5">
                      {videoSpotlight.specs.fileSize}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Ánh sáng</dt>
                    <dd className="text-slate-200 mt-0.5">{videoSpotlight.specs.lighting}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Chủ đề</dt>
                    <dd className="text-slate-200 mt-0.5">{videoSpotlight.specs.concept}</dd>
                  </div>
                </dl>

                <div className="flex flex-wrap items-center gap-3">
                  {inlinePlayingVideoId !== videoSpotlight.id && (
                    <button
                      type="button"
                      onClick={() => setInlinePlayingVideoId(videoSpotlight.id)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs sm:text-sm font-semibold shadow-[0_10px_24px_-8px_rgba(2,132,199,0.65)] transition-colors cursor-pointer"
                    >
                      <Play className="w-4 h-4" aria-hidden="true" />
                      <span>Phát Video Ngay</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onSelectArtwork(videoSpotlight, visibleArtworks)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#243D63] hover:border-[#38BDF8] bg-[#0A162B]/60 text-slate-100 hover:text-white text-xs sm:text-sm font-medium transition-colors cursor-pointer"
                  >
                    <Expand className="w-4 h-4" aria-hidden="true" />
                    <span>Mở Toàn Màn Hình</span>
                  </button>
                </div>
              </div>
            </figcaption>
          </figure>
        </div>
      )}

      {/* Search Results Indicator */}
      {searchQuery.trim() !== '' && (
        <div className="flex items-center justify-between gap-3 text-xs sm:text-sm text-[#475569] dark:text-[#94A3B8]">
          <p>
            Tìm thấy{' '}
            <strong className="font-mono tabular-nums text-[#070B14] dark:text-[#F1F5F9]">
              {visibleArtworks.length}
            </strong>{' '}
            tác phẩm phù hợp với từ khóa “{searchQuery.trim()}”.
          </p>
        </div>
      )}

      {/* Empty Search State */}
      {visibleArtworks.length === 0 ? (
        <div className="py-16 px-6 rounded-3xl border border-dashed border-[#CBD8E6] dark:border-[#1E3250] bg-white/60 dark:bg-[#0B1220]/60 text-center space-y-4">
          <p className="font-display text-2xl sm:text-3xl font-semibold text-[#070B14] dark:text-[#F1F5F9]">
            Chưa có khung hình khớp với từ khóa này
          </p>
          <p className="text-sm text-[#475569] dark:text-[#94A3B8] max-w-md mx-auto">
            Thử tìm với từ khóa khác như “hoa đào”, “MISA”, “rừng thông”, “guitar” hoặc đặt lại
            bộ lọc để xem toàn bộ {counts.all} tác phẩm.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0A192F] hover:bg-[#13294B] dark:bg-[#0284C7] dark:hover:bg-[#0369A1] text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
          >
            Xem Toàn Bộ ({counts.all} Tác Phẩm)
          </button>
        </div>
      ) : viewMode === 'masonry' ? (
        /* Museum Natural-Aspect Masonry View */
        <div id="gallery-grid" className="columns-1 sm:columns-2 lg:columns-3 gap-5 sm:gap-6">
          {gridArtworks.map((artwork) => {
            const isVideo = artwork.mediaType === 'video';
            const hasFailed = failedImages[artwork.id];
            const thumbSrc = artwork.posterSrc || artwork.src;

            return (
              <figure
                key={artwork.id}
                data-gallery-card="true"
                className="break-inside-avoid mb-5 sm:mb-6 group relative rounded-2xl overflow-hidden border border-[#DCE6F2] dark:border-[#182740] bg-[#060C18] shadow-[0_12px_30px_-18px_rgba(10,25,47,0.22)] hover:shadow-[0_20px_42px_-16px_rgba(2,132,199,0.28)] hover:border-[#0284C7]/60 dark:hover:border-[#38BDF8]/60 transition-all duration-300"
              >
                <button
                  type="button"
                  onClick={() => onSelectArtwork(artwork, visibleArtworks)}
                  aria-label={`Xem chi tiết tác phẩm ${artwork.title}`}
                  className="relative w-full block text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
                >
                  {hasFailed ? (
                    <div className="aspect-[4/3] w-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#0A192F] to-[#05080F] text-[#F1F5F9]">
                      <p className="font-display text-xl font-semibold">{artwork.title}</p>
                      <p className="text-xs text-[#94A3B8] mt-1">{artwork.specs.format}</p>
                    </div>
                  ) : (
                    <img
                      src={thumbSrc}
                      alt={artwork.alt}
                      width={artwork.width}
                      height={artwork.height}
                      loading="eager"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setFailedImages((prev) => ({ ...prev, [artwork.id]: true }))
                      }
                      className="w-full h-auto block transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
                    />
                  )}

                  {/* Measured Bottom Contrast Scrim for Crisp Caption Legibility */}
                  <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#030712]/95 via-[#061224]/62 to-transparent pointer-events-none" />

                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    {isVideo && (
                      <span className="w-8 h-8 rounded-full bg-[#0284C7]/90 text-white border border-white/30 flex items-center justify-center shadow-md">
                        <Play className="w-3.5 h-3.5 ml-0.5" aria-hidden="true" />
                      </span>
                    )}
                    <span className="w-8 h-8 rounded-full bg-[#05080F]/65 backdrop-blur-md border border-[#38BDF8]/35 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-200">
                      <Expand className="w-3.5 h-3.5" aria-hidden="true" />
                    </span>
                  </div>

                  <figcaption className="absolute inset-x-0 bottom-0 p-4 sm:p-5 text-white space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] text-[#7DD3FC] font-medium">
                      <span className="truncate">{artwork.categoryLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums text-slate-300 shrink-0">
                        {artwork.year}
                      </span>
                    </div>
                    <h2 className="font-display text-lg sm:text-xl font-semibold leading-snug text-white line-clamp-2">
                      {artwork.title}
                    </h2>
                  </figcaption>
                </button>
              </figure>
            );
          })}
        </div>
      ) : (
        /* Editorial Story Card View */
        <div
          id="gallery-grid"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6"
        >
          {gridArtworks.map((artwork) => {
            const isVideo = artwork.mediaType === 'video';
            const hasFailed = failedImages[artwork.id];
            const objectPosClass =
              artwork.objectPosition === 'center' ? 'object-center' : 'object-top';
            const thumbSrc = artwork.posterSrc || artwork.src;

            return (
              <figure
                key={artwork.id}
                data-gallery-card="true"
                className="soft-card group flex flex-col justify-between rounded-2xl overflow-hidden border border-[#DCE6F2] dark:border-[#182740] bg-white/95 dark:bg-[#0B1220]/95 hover:border-[#0284C7]/60 dark:hover:border-[#38BDF8]/60"
              >
                <button
                  type="button"
                  onClick={() => onSelectArtwork(artwork, visibleArtworks)}
                  aria-label={`Xem chi tiết tác phẩm ${artwork.title}`}
                  className="relative w-full aspect-[4/3] overflow-hidden bg-[#060B14] block text-left cursor-pointer"
                >
                  {hasFailed ? (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#0A192F] to-[#05080F] text-[#F1F5F9]">
                      <p className="font-display text-xl font-semibold">{artwork.title}</p>
                      <p className="text-xs text-[#94A3B8] mt-1">{artwork.specs.format}</p>
                    </div>
                  ) : (
                    <img
                      src={thumbSrc}
                      alt={artwork.alt}
                      width={artwork.width}
                      height={artwork.height}
                      loading="eager"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setFailedImages((prev) => ({ ...prev, [artwork.id]: true }))
                      }
                      className={`w-full h-full object-cover ${objectPosClass} transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]`}
                    />
                  )}

                  <span className="absolute top-3.5 right-3.5 w-9 h-9 rounded-full bg-[#05080F]/65 backdrop-blur-md border border-[#38BDF8]/35 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {isVideo ? (
                      <Play className="w-4 h-4 ml-0.5" aria-hidden="true" />
                    ) : (
                      <Expand className="w-4 h-4" aria-hidden="true" />
                    )}
                  </span>
                </button>

                <figcaption className="p-5 sm:p-6 space-y-2.5 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-[#475569] dark:text-[#94A3B8] whitespace-nowrap overflow-hidden">
                      <span className="text-[#0369A1] dark:text-[#38BDF8] font-medium truncate">
                        {artwork.categoryLabel}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums shrink-0">
                        {artwork.specs.aspect}
                      </span>
                    </div>

                    <h2 className="font-display text-xl sm:text-[22px] font-semibold text-[#070B14] dark:text-[#F1F5F9] leading-snug">
                      <button
                        type="button"
                        onClick={() => onSelectArtwork(artwork, visibleArtworks)}
                        className="text-left hover:text-[#0284C7] dark:hover:text-[#38BDF8] transition-colors cursor-pointer"
                      >
                        {artwork.title}
                      </button>
                    </h2>

                    <p className="text-xs sm:text-sm text-[#475569] dark:text-[#94A3B8] leading-relaxed line-clamp-3">
                      {artwork.story}
                    </p>
                  </div>

                  <div className="pt-3.5 mt-3 border-t border-[#E9F0F8] dark:border-[#152339] flex items-center justify-between text-xs text-[#475569] dark:text-[#94A3B8]">
                    <span className="truncate">{artwork.specs.fileSize}</span>
                    <span className="font-mono tabular-nums shrink-0 ml-2">{artwork.year}</span>
                  </div>
                </figcaption>
              </figure>
            );
          })}
        </div>
      )}

      {/* Exhibition Cross-Link Strip back to Profile */}
      <div className="soft-card p-6 sm:p-8 rounded-3xl border border-[#DCE6F2] dark:border-[#182740] bg-white/95 dark:bg-[#0B1220]/95 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-medium text-[#0369A1] dark:text-[#38BDF8] tracking-wide">
            Hồ Sơ Kỹ Thuật &amp; Kinh Nghiệm
          </p>
          <p className="font-display text-2xl sm:text-[28px] font-semibold text-[#070B14] dark:text-[#F1F5F9]">
            Xem Nền Tảng Backend .NET &amp; Dự Án Hệ Thống Doanh Nghiệp
          </p>
        </div>
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            onBackToProfile();
          }}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#0A192F] hover:bg-[#13294B] dark:bg-[#0284C7] dark:hover:bg-[#0369A1] text-white font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5 whitespace-nowrap shrink-0"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Về Trang Hồ Sơ</span>
        </a>
      </div>
    </section>
  );
}
