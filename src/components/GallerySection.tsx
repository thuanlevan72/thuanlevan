import {
  ArrowLeft,
  Expand,
  Film,
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
  GALLERY_TEMPLATE_OPTIONS,
  GalleryCategory,
  GalleryTemplateId,
  getGalleryCategoryCounts,
  resolveTemplateSelection,
  searchAndFilterGalleryItems,
  SHOWCASE_TEMPLATE_IDS,
  ThemeMode,
} from '../utils/portfolioLogic.ts';
import { TemplateSwitcherBar } from './TemplateSwitcherBar.tsx';

interface GallerySectionProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  onSelectArtwork: (artwork: ArtworkItem, scopeList: ArtworkItem[]) => void;
  onBackToProfile: () => void;
}

const GALLERY_TEMPLATE_STORAGE_KEY = 'thuanle-gallery-template';

export function GallerySection({
  theme,
  onToggleTheme,
  onSelectArtwork,
  onBackToProfile,
}: GallerySectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<GalleryCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [galleryTemplate, setGalleryTemplate] = useState<GalleryTemplateId>(() => {
    try {
      return resolveTemplateSelection(
        localStorage.getItem(GALLERY_TEMPLATE_STORAGE_KEY),
        SHOWCASE_TEMPLATE_IDS,
        'modern'
      );
    } catch {
      return 'modern';
    }
  });
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [inlinePlayingVideoId, setInlinePlayingVideoId] = useState<string | null>(null);

  const handleTemplateChange = (nextTemplate: GalleryTemplateId) => {
    setGalleryTemplate(nextTemplate);
    try {
      localStorage.setItem(GALLERY_TEMPLATE_STORAGE_KEY, nextTemplate);
    } catch {
      // Ignore storage errors
    }
  };

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
              className="inline-flex items-center gap-2 px-3.5 py-2 min-h-[38px] rounded-xl border border-[#DCE6F2] dark:border-[#1E3250] bg-white/90 dark:bg-[#0B1220]/90 text-xs font-medium text-[#070B14] dark:text-[#F1F5F9] hover:border-[#0284C7] dark:hover:border-[#38BDF8] transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer"
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
                lệ khung hình gốc — chọn ngay 1 trong 6 phong cách trưng bày bên dưới.
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

        {/* Template Switcher Bar + Category Filter Tabs + Instant Search */}
        <div className="space-y-4 pt-1">
          <div className="rounded-2xl border border-[#DCE6F2] dark:border-[#182740] bg-white/80 dark:bg-[#0B1220]/80 px-4 py-3">
            <TemplateSwitcherBar
              id="gallery-template-switcher"
              label="Phong Cách Phòng Tranh"
              ariaLabel="Chọn phong cách bố cục triển lãm ảnh"
              options={GALLERY_TEMPLATE_OPTIONS}
              activeId={galleryTemplate}
              onChange={handleTemplateChange}
            />
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
            <div
              id="gallery-filters"
              role="tablist"
              aria-label="Lọc bộ sưu tập ảnh theo chủ đề"
              className="flex items-center gap-1 p-1.5 rounded-xl bg-[#E8F0F9] dark:bg-[#0B1426] border border-[#DCE6F2] dark:border-[#182740] overflow-x-auto max-w-full"
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

            {/* Instant Search */}
            <div className="relative w-full lg:w-80 shrink-0">
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
                className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-[#DCE6F2] dark:border-[#182740] bg-white/95 dark:bg-[#0B1220]/95 text-xs sm:text-sm text-[#070B14] dark:text-[#F1F5F9] placeholder:text-[#64748B] dark:placeholder:text-[#64748B] focus:outline-none focus:border-[#0284C7] dark:focus:border-[#38BDF8] transition-colors"
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
      ) : galleryTemplate === 'modern' ? (
        /* 1. HIỆN ĐẠI — Khung Bento 12 Cột Chuẩn Mực (8+4 & 4+4+4) */
        <div
          id="gallery-grid"
          data-template="modern"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-5 sm:gap-6"
        >
          {gridArtworks.map((artwork, index) => {
            const isVideo = artwork.mediaType === 'video';
            const hasFailed = failedImages[artwork.id];
            const thumbSrc = artwork.posterSrc || artwork.src;
            const isLeadSlot = index % 5 === 0;
            const objectPosClass =
              artwork.objectPosition === 'center' ? 'object-center' : 'object-top';
            const spanClass = isLeadSlot
              ? 'sm:col-span-2 lg:col-span-8'
              : 'sm:col-span-1 lg:col-span-4';

            if (isLeadSlot && artwork.aspectType === 'portrait') {
              return (
                <figure
                  key={artwork.id}
                  data-gallery-card="true"
                  className={`${spanClass} soft-card group rounded-3xl overflow-hidden border border-[#DCE6F2] dark:border-[#182740] bg-white/95 dark:bg-[#0B1220]/95 hover:border-[#0284C7]/60 dark:hover:border-[#38BDF8]/60 grid grid-cols-1 sm:grid-cols-12`}
                >
                  <button
                    type="button"
                    onClick={() => onSelectArtwork(artwork, visibleArtworks)}
                    aria-label={`Xem chi tiết tác phẩm ${artwork.title}`}
                    className="relative sm:col-span-6 min-h-[280px] sm:min-h-[360px] overflow-hidden bg-[#060C18] text-left cursor-pointer"
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
                        loading={index < 6 ? 'eager' : 'lazy'}
                        decoding="async"
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setFailedImages((prev) => ({ ...prev, [artwork.id]: true }))
                        }
                        className={`w-full h-full object-cover ${objectPosClass} transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]`}
                      />
                    )}
                    <span className="absolute top-3.5 right-3.5 w-9 h-9 rounded-full bg-[#05080F]/65 backdrop-blur-md border border-[#38BDF8]/35 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Expand className="w-4 h-4" aria-hidden="true" />
                    </span>
                  </button>

                  <figcaption className="sm:col-span-6 p-6 sm:p-7 flex flex-col justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-medium text-[#0369A1] dark:text-[#38BDF8] truncate">
                          {artwork.categoryLabel}
                        </span>
                        <span className="font-mono tabular-nums text-[#64748B] dark:text-[#94A3B8] shrink-0">
                          {artwork.year}
                        </span>
                      </div>
                      <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#070B14] dark:text-[#F1F5F9] leading-snug">
                        <button
                          type="button"
                          onClick={() => onSelectArtwork(artwork, visibleArtworks)}
                          className="text-left hover:text-[#0284C7] dark:hover:text-[#38BDF8] transition-colors cursor-pointer"
                        >
                          {artwork.title}
                        </button>
                      </h2>
                      <p className="text-xs font-medium text-[#475569] dark:text-[#94A3B8]">
                        {artwork.subtitle}
                      </p>
                      <p className="text-xs sm:text-sm text-[#475569] dark:text-[#94A3B8] leading-relaxed line-clamp-4">
                        {artwork.story}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-[#E9F0F8] dark:border-[#152339] flex items-center justify-between gap-2 text-xs text-[#475569] dark:text-[#94A3B8]">
                      <span className="font-mono truncate">{artwork.specs.fileSize}</span>
                      <button
                        type="button"
                        onClick={() => onSelectArtwork(artwork, visibleArtworks)}
                        className="font-semibold text-[#0369A1] dark:text-[#38BDF8] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Mở Khung Hình →
                      </button>
                    </div>
                  </figcaption>
                </figure>
              );
            }

            return (
              <figure
                key={artwork.id}
                data-gallery-card="true"
                className={`${spanClass} group relative rounded-3xl overflow-hidden border border-[#DCE6F2] dark:border-[#182740] bg-[#060C18] shadow-[0_12px_30px_-18px_rgba(10,25,47,0.22)] hover:shadow-[0_20px_42px_-16px_rgba(2,132,199,0.28)] hover:border-[#0284C7]/60 dark:hover:border-[#38BDF8]/60 transition-all duration-300`}
              >
                <button
                  type="button"
                  onClick={() => onSelectArtwork(artwork, visibleArtworks)}
                  aria-label={`Xem chi tiết tác phẩm ${artwork.title}`}
                  className="relative w-full h-[300px] sm:h-[340px] lg:h-[360px] block text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
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
                      loading={index < 6 ? 'eager' : 'lazy'}
                      decoding="async"
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setFailedImages((prev) => ({ ...prev, [artwork.id]: true }))
                      }
                      className={`w-full h-full object-cover ${objectPosClass} transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]`}
                    />
                  )}

                  <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#030712]/95 via-[#061224]/65 to-transparent pointer-events-none" />

                  <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5">
                    {isVideo && (
                      <span className="w-8 h-8 rounded-full bg-[#0284C7]/90 text-white border border-white/30 flex items-center justify-center shadow-md">
                        <Play className="w-3.5 h-3.5 ml-0.5" aria-hidden="true" />
                      </span>
                    )}
                    <span className="w-8 h-8 rounded-full bg-[#05080F]/65 backdrop-blur-md border border-[#38BDF8]/35 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-200">
                      <Expand className="w-3.5 h-3.5" aria-hidden="true" />
                    </span>
                  </div>

                  <figcaption className="absolute inset-x-0 bottom-0 p-5 sm:p-6 text-white space-y-1.5">
                    <div className="flex items-center gap-2 text-[11px] text-[#7DD3FC] font-medium">
                      <span className="truncate">{artwork.categoryLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums text-slate-300 shrink-0">
                        {artwork.specs.aspect}
                      </span>
                    </div>
                    <h2
                      className={`font-display font-semibold leading-snug text-white ${
                        isLeadSlot ? 'text-2xl sm:text-3xl' : 'text-lg sm:text-xl'
                      }`}
                    >
                      {artwork.title}
                    </h2>
                    {isLeadSlot && (
                      <p className="text-xs sm:text-sm text-slate-200 line-clamp-2 max-w-xl">
                        {artwork.story}
                      </p>
                    )}
                  </figcaption>
                </button>
              </figure>
            );
          })}
        </div>
      ) : galleryTemplate === 'classical' ? (
        /* 2. CỔ TRANG — Họa Đường Thủy Mặc, Tranh Cuộn Khung Kép & Lạc Khoản */
        <div
          id="gallery-grid"
          data-template="classical"
          className="space-y-8 max-w-5xl mx-auto"
        >
          {gridArtworks.map((artwork, index) => {
            const hasFailed = failedImages[artwork.id];
            const thumbSrc = artwork.posterSrc || artwork.src;
            const plateNum = String(index + 1).padStart(2, '0');

            return (
              <figure
                key={artwork.id}
                data-gallery-card="true"
                className="rounded-3xl border-2 border-[#CBB58D] dark:border-[#4F3B24] bg-[#FBF6EC] dark:bg-[#120E0B] p-2 sm:p-3 shadow-[0_18px_48px_-22px_rgba(92,61,32,0.22)]"
              >
                <div className="rounded-2xl border border-[#DFCDAE] dark:border-[#3A2B1B] grid grid-cols-1 lg:grid-cols-12 items-stretch overflow-hidden">
                  <button
                    type="button"
                    onClick={() => onSelectArtwork(artwork, visibleArtworks)}
                    aria-label={`Xem chi tiết tác phẩm ${artwork.title}`}
                    className="lg:col-span-7 relative min-h-[260px] sm:min-h-[340px] bg-[#140F0B] flex items-center justify-center p-5 sm:p-7 cursor-pointer group"
                  >
                    <div className="p-1.5 border-2 border-[#B48332]/80 rounded-xl bg-[#0D0906]">
                      {hasFailed ? (
                        <div className="aspect-[4/3] w-64 flex flex-col items-center justify-center p-6 text-center text-[#F5E6D0]">
                          <p className="font-display text-xl">{artwork.title}</p>
                        </div>
                      ) : (
                        <img
                          src={thumbSrc}
                          alt={artwork.alt}
                          width={artwork.width}
                          height={artwork.height}
                          loading={index < 6 ? 'eager' : 'lazy'}
                          decoding="async"
                          referrerPolicy="no-referrer"
                          onError={() =>
                            setFailedImages((prev) => ({ ...prev, [artwork.id]: true }))
                          }
                          className="max-h-[360px] w-auto max-w-full object-contain rounded-lg transition-transform duration-500 group-hover:scale-[1.02]"
                        />
                      )}
                    </div>
                  </button>

                  <figcaption className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between gap-5 border-t lg:border-t-0 lg:border-l border-[#DFCDAE] dark:border-[#3A2B1B]">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 border border-[#9E2A2B] dark:border-[#E05252] text-[#9E2A2B] dark:text-[#F4B860] font-mono text-[11px] font-bold">
                          HỒI {plateNum} · {artwork.year}
                        </span>
                        <span className="font-mono text-xs text-[#6E533B] dark:text-[#C8B29A]">
                          {artwork.specs.aspect}
                        </span>
                      </div>

                      <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#2A1B12] dark:text-[#F5E6D0] leading-snug">
                        <button
                          type="button"
                          onClick={() => onSelectArtwork(artwork, visibleArtworks)}
                          className="text-left hover:text-[#9E2A2B] dark:hover:text-[#F4B860] transition-colors cursor-pointer"
                        >
                          {artwork.title}
                        </button>
                      </h2>
                      <p className="font-display italic text-sm text-[#9E2A2B] dark:text-[#D4A359]">
                        {artwork.subtitle}
                      </p>
                      <p className="text-xs sm:text-sm text-[#5C4633] dark:text-[#C8B29A] leading-[1.8]">
                        {artwork.story}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-[#DFCDAE] dark:border-[#3A2B1B] flex items-center justify-between gap-2 text-xs">
                      <span className="font-mono text-[#6E533B] dark:text-[#C8B29A] truncate">
                        {artwork.specs.fileSize}
                      </span>
                      <button
                        type="button"
                        onClick={() => onSelectArtwork(artwork, visibleArtworks)}
                        className="font-semibold text-[#8B2324] dark:text-[#F4B860] hover:underline whitespace-nowrap cursor-pointer"
                      >
                        Thưởng Lãm Chi Tiết →
                      </button>
                    </div>
                  </figcaption>
                </div>
              </figure>
            );
          })}
        </div>
      ) : galleryTemplate === 'introvert' ? (
        /* 3. HƯỚNG NỘI — Phòng Tranh Tĩnh Lặng Một Dải Thưa Khoảng Trắng */
        <div
          id="gallery-grid"
          data-template="introvert"
          className="max-w-3xl mx-auto space-y-12"
        >
          {gridArtworks.map((artwork, index) => {
            const hasFailed = failedImages[artwork.id];
            const thumbSrc = artwork.posterSrc || artwork.src;

            return (
              <figure
                key={artwork.id}
                data-gallery-card="true"
                className="space-y-4 pb-10 border-b border-[#E2E8F0] dark:border-[#1E293B] last:border-b-0"
              >
                <button
                  type="button"
                  onClick={() => onSelectArtwork(artwork, visibleArtworks)}
                  aria-label={`Xem chi tiết tác phẩm ${artwork.title}`}
                  className="w-full rounded-2xl overflow-hidden bg-[#0D1117] border border-[#E2E8F0] dark:border-[#1E293B] flex items-center justify-center p-3 sm:p-5 cursor-pointer group"
                >
                  {hasFailed ? (
                    <div className="aspect-[4/3] w-full flex items-center justify-center text-[#94A3B8]">
                      {artwork.title}
                    </div>
                  ) : (
                    <img
                      src={thumbSrc}
                      alt={artwork.alt}
                      width={artwork.width}
                      height={artwork.height}
                      loading={index < 4 ? 'eager' : 'lazy'}
                      decoding="async"
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setFailedImages((prev) => ({ ...prev, [artwork.id]: true }))
                      }
                      className="max-h-[540px] w-auto max-w-full object-contain rounded-xl transition-transform duration-500 group-hover:scale-[1.015]"
                    />
                  )}
                </button>

                <figcaption className="space-y-2 px-1">
                  <div className="flex items-center justify-between gap-2 text-xs font-mono text-[#64748B] dark:text-[#94A3B8]">
                    <span>
                      0{index + 1}. {artwork.categoryLabel}
                    </span>
                    <span>
                      {artwork.year} · {artwork.specs.fileSize}
                    </span>
                  </div>
                  <h2 className="font-display text-2xl sm:text-[26px] font-medium text-[#1E293B] dark:text-[#E2E8F0]">
                    <button
                      type="button"
                      onClick={() => onSelectArtwork(artwork, visibleArtworks)}
                      className="text-left hover:text-[#0284C7] dark:hover:text-[#38BDF8] transition-colors cursor-pointer"
                    >
                      {artwork.title}
                    </button>
                  </h2>
                  <p className="text-sm text-[#475569] dark:text-[#94A3B8] leading-[1.8]">
                    {artwork.story}
                  </p>
                </figcaption>
              </figure>
            );
          })}
        </div>
      ) : galleryTemplate === 'extrovert' ? (
        /* 4. HƯỚNG NGOẠI — Sân Khấu Ảnh Lớn Đầy Năng Lượng */
        <div
          id="gallery-grid"
          data-template="extrovert"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {gridArtworks.map((artwork, index) => {
            const isVideo = artwork.mediaType === 'video';
            const hasFailed = failedImages[artwork.id];
            const objectPosClass =
              artwork.objectPosition === 'center' ? 'object-center' : 'object-top';
            const thumbSrc = artwork.posterSrc || artwork.src;
            const isWideStage = index % 4 === 0 && artwork.aspectType === 'landscape';

            return (
              <figure
                key={artwork.id}
                data-gallery-card="true"
                className={`group flex flex-col justify-between rounded-3xl overflow-hidden border border-[#BFDBFE] dark:border-[#1E3A5F] bg-white dark:bg-[#0B1220] shadow-[0_18px_40px_-20px_rgba(29,78,216,0.28)] ${
                  isWideStage ? 'md:col-span-2' : ''
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelectArtwork(artwork, visibleArtworks)}
                  aria-label={`Xem chi tiết tác phẩm ${artwork.title}`}
                  className="relative w-full h-[280px] sm:h-[320px] overflow-hidden bg-[#060B14] block text-left cursor-pointer"
                >
                  {hasFailed ? (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-white">
                      <p className="font-display text-xl font-bold">{artwork.title}</p>
                    </div>
                  ) : (
                    <img
                      src={thumbSrc}
                      alt={artwork.alt}
                      width={artwork.width}
                      height={artwork.height}
                      loading={index < 6 ? 'eager' : 'lazy'}
                      decoding="async"
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setFailedImages((prev) => ({ ...prev, [artwork.id]: true }))
                      }
                      className={`w-full h-full object-cover ${objectPosClass} transition-transform duration-500 group-hover:scale-[1.04]`}
                    />
                  )}
                  <span className="absolute top-3.5 right-3.5 w-9 h-9 rounded-full bg-[#0284C7] text-white flex items-center justify-center shadow-lg opacity-90 group-hover:opacity-100">
                    {isVideo ? (
                      <Play className="w-4 h-4 ml-0.5" aria-hidden="true" />
                    ) : (
                      <Expand className="w-4 h-4" aria-hidden="true" />
                    )}
                  </span>
                </button>

                <figcaption className="p-5 sm:p-6 space-y-2.5 flex-1 flex flex-col justify-between bg-gradient-to-b from-white to-[#F4F8FF] dark:from-[#0B1220] dark:to-[#08101D]">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 text-xs font-mono">
                      <span className="font-bold text-[#1D4ED8] dark:text-[#38BDF8] truncate">
                        {artwork.categoryLabel}
                      </span>
                      <span className="text-[#475569] dark:text-[#94A3B8] shrink-0">
                        {artwork.year}
                      </span>
                    </div>
                    <h2 className="font-display text-xl sm:text-2xl font-bold text-[#070B14] dark:text-white leading-snug">
                      <button
                        type="button"
                        onClick={() => onSelectArtwork(artwork, visibleArtworks)}
                        className="text-left hover:text-[#1D4ED8] dark:hover:text-[#38BDF8] transition-colors cursor-pointer"
                      >
                        {artwork.title}
                      </button>
                    </h2>
                    <p className="text-xs sm:text-sm text-[#334155] dark:text-[#CBD5E1] leading-relaxed line-clamp-3">
                      {artwork.story}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#DBEAFE] dark:border-[#1E3A5F] flex items-center justify-between text-xs font-mono text-[#0369A1] dark:text-[#7DD3FC]">
                    <span>{artwork.specs.fileSize}</span>
                    <span>{artwork.specs.aspect}</span>
                  </div>
                </figcaption>
              </figure>
            );
          })}
        </div>
      ) : galleryTemplate === 'youthful' ? (
        /* 5. TRẺ TRUNG — Lưới Cắt Dán Phá Cách Tự Nhiên + Viền Offset */
        <div
          id="gallery-grid"
          data-template="youthful"
          className="columns-1 sm:columns-2 lg:columns-3 gap-5 sm:gap-6"
        >
          {gridArtworks.map((artwork, index) => {
            const isVideo = artwork.mediaType === 'video';
            const hasFailed = failedImages[artwork.id];
            const thumbSrc = artwork.posterSrc || artwork.src;

            return (
              <figure
                key={artwork.id}
                data-gallery-card="true"
                className="break-inside-avoid mb-5 sm:mb-6 group rounded-2xl overflow-hidden border-2 border-[#0F172A] dark:border-[#2DD4BF]/60 bg-white dark:bg-[#0B1220] shadow-[6px_6px_0px_#2563EB] dark:shadow-[6px_6px_0px_#0D9488]"
              >
                <button
                  type="button"
                  onClick={() => onSelectArtwork(artwork, visibleArtworks)}
                  aria-label={`Xem chi tiết tác phẩm ${artwork.title}`}
                  className="relative w-full block text-left cursor-pointer overflow-hidden"
                >
                  {hasFailed ? (
                    <div className="aspect-[4/3] w-full flex flex-col items-center justify-center p-6 text-center bg-[#0B1220] text-white">
                      <p className="font-display text-xl font-bold">{artwork.title}</p>
                    </div>
                  ) : (
                    <img
                      src={thumbSrc}
                      alt={artwork.alt}
                      width={artwork.width}
                      height={artwork.height}
                      loading={index < 6 ? 'eager' : 'lazy'}
                      decoding="async"
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setFailedImages((prev) => ({ ...prev, [artwork.id]: true }))
                      }
                      className="w-full h-auto block transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  )}
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-[#2563EB] dark:bg-[#0D9488] text-white font-mono text-[11px] font-bold shadow">
                    #{String(index + 1).padStart(2, '0')}
                  </span>
                  {isVideo && (
                    <span className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[#0F172A] text-white flex items-center justify-center">
                      <Play className="w-3.5 h-3.5 ml-0.5" aria-hidden="true" />
                    </span>
                  )}
                </button>

                <figcaption className="p-4 sm:p-5 space-y-1.5 bg-white dark:bg-[#0B1220] border-t-2 border-[#0F172A] dark:border-[#1E3A5F]">
                  <div className="flex items-center justify-between text-[11px] font-mono font-bold text-[#0D9488] dark:text-[#2DD4BF]">
                    <span className="truncate">{artwork.categoryLabel}</span>
                    <span className="shrink-0">{artwork.year}</span>
                  </div>
                  <h2 className="font-display text-lg sm:text-xl font-bold text-[#0F172A] dark:text-white leading-snug">
                    <button
                      type="button"
                      onClick={() => onSelectArtwork(artwork, visibleArtworks)}
                      className="text-left hover:text-[#2563EB] dark:hover:text-[#38BDF8] transition-colors cursor-pointer"
                    >
                      {artwork.title}
                    </button>
                  </h2>
                </figcaption>
              </figure>
            );
          })}
        </div>
      ) : (
        /* 6. HOÀI CỔ — Cuộn Phim 35mm & Thẻ Ảnh Polaroid Lưu Trữ */
        <div
          id="gallery-grid"
          data-template="retro"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {gridArtworks.map((artwork, index) => {
            const hasFailed = failedImages[artwork.id];
            const objectPosClass =
              artwork.objectPosition === 'center' ? 'object-center' : 'object-top';
            const thumbSrc = artwork.posterSrc || artwork.src;
            const frameCode = `EXP #${String(index + 1).padStart(2, '0')}A`;

            return (
              <figure
                key={artwork.id}
                data-gallery-card="true"
                className="group p-3.5 pb-6 rounded-sm border border-[#D4C3A3] dark:border-[#4A3B2C] bg-[#FDF9F0] dark:bg-[#1E1812] shadow-[0_14px_30px_-18px_rgba(67,40,24,0.35)] flex flex-col justify-between gap-4"
              >
                <div className="flex items-center justify-between font-mono text-[10px] font-bold tracking-widest text-[#92400E] dark:text-[#FBBF24]">
                  <span>{frameCode} · 35MM ARCHIVE</span>
                  <span>{artwork.specs.aspect}</span>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectArtwork(artwork, visibleArtworks)}
                  aria-label={`Xem chi tiết tác phẩm ${artwork.title}`}
                  className="relative aspect-[4/3] w-full overflow-hidden bg-[#16120E] border border-[#D4C3A3] dark:border-[#3A2D20] block cursor-pointer"
                >
                  {hasFailed ? (
                    <div className="w-full h-full flex items-center justify-center p-4 text-center text-[#F3E5D0]">
                      {artwork.title}
                    </div>
                  ) : (
                    <img
                      src={thumbSrc}
                      alt={artwork.alt}
                      width={artwork.width}
                      height={artwork.height}
                      loading={index < 6 ? 'eager' : 'lazy'}
                      decoding="async"
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setFailedImages((prev) => ({ ...prev, [artwork.id]: true }))
                      }
                      className={`w-full h-full object-cover ${objectPosClass} sepia-[.18] group-hover:sepia-0 transition-all duration-500 group-hover:scale-[1.03]`}
                    />
                  )}
                </button>

                <figcaption className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between gap-2 font-mono text-[11px] text-[#785535] dark:text-[#D6B89C]">
                    <span className="truncate">{artwork.categoryLabel}</span>
                    <span className="shrink-0">{artwork.year}</span>
                  </div>
                  <h2 className="font-display text-xl font-bold text-[#2C1810] dark:text-[#F5E6D3] leading-snug">
                    <button
                      type="button"
                      onClick={() => onSelectArtwork(artwork, visibleArtworks)}
                      className="text-left hover:text-[#B45309] dark:hover:text-[#FBBF24] transition-colors cursor-pointer"
                    >
                      {artwork.title}
                    </button>
                  </h2>
                  <p className="text-xs text-[#5C3D2E] dark:text-[#D6B89C] leading-relaxed line-clamp-2">
                    {artwork.story}
                  </p>
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
