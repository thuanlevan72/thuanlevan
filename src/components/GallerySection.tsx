import { ArrowLeft, Expand, Film, Moon, Play, Sun } from 'lucide-react';
import { useMemo, useState } from 'react';
import { GALLERY_ARTWORKS } from '../data/portfolioData.ts';
import {
  ArtworkItem,
  filterGalleryItems,
  GalleryCategory,
  getGalleryCategoryCounts,
  ThemeMode,
} from '../utils/portfolioLogic.ts';

interface GallerySectionProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  onSelectArtwork: (artwork: ArtworkItem) => void;
  onBackToProfile: () => void;
}

export function GallerySection({
  theme,
  onToggleTheme,
  onSelectArtwork,
  onBackToProfile,
}: GallerySectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<GalleryCategory>('all');
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [inlinePlayingVideoId, setInlinePlayingVideoId] = useState<string | null>(null);

  const counts = useMemo(() => getGalleryCategoryCounts(GALLERY_ARTWORKS), []);
  const visibleArtworks = useMemo(
    () => filterGalleryItems(GALLERY_ARTWORKS, selectedCategory),
    [selectedCategory]
  );

  const nonVideoPortraitCount = useMemo(
    () =>
      visibleArtworks.filter(
        (item) => item.mediaType !== 'video' && item.aspectType === 'portrait'
      ).length,
    [visibleArtworks]
  );

  const filterTabs: { id: GalleryCategory; label: string }[] = [
    { id: 'all', label: `Tất Cả (${counts.all})` },
    { id: 'imperial', label: `Cổ Phong & Nho Sĩ (${counts.imperial})` },
    { id: 'poetic', label: `Nàng Thơ Hoa Đào (${counts.poetic})` },
    { id: 'portrait', label: `Chân Dung & Video (${counts.portrait})` },
    { id: 'moments', label: `Đồng Đội & Kỷ Niệm (${counts.moments})` },
  ];

  return (
    <section id="gallery" className="pt-8 sm:pt-12 pb-6 space-y-10">
      {/* Dedicated Exhibition Header & Navigation Back to Engineering Profile */}
      <div className="space-y-6 border-b border-[#E6E0D6] dark:border-[#27262B] pb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onBackToProfile();
            }}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-[#5E5852] dark:text-[#A8A29E] hover:text-[#9F1239] dark:hover:text-[#FB7185] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Quay Lại Hồ Sơ Kỹ Sư</span>
          </a>

          <button
            id="theme-toggle-btn"
            type="button"
            onClick={onToggleTheme}
            aria-label="Chuyển đổi giao diện Sáng / Tối"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#D8D0C5] dark:border-[#2E2D33] bg-white dark:bg-[#141418] text-xs font-medium text-[#181615] dark:text-[#F4F1EC] hover:border-[#9F1239] dark:hover:border-[#FB7185] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {theme === 'dark' ? (
              <Moon className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-[#A16207]" aria-hidden="true" />
            )}
            <span id="theme-text">{theme === 'dark' ? 'Nền Tối' : 'Nền Sáng'}</span>
          </button>
        </div>

        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <p className="text-xs sm:text-sm font-medium text-[#9F1239] dark:text-[#FB7185]">
              Phòng Trưng Bày Độc Lập · Tác Giả Thuận Lê
            </p>
            <h1 className="font-display font-bold text-4xl sm:text-5xl text-[#181615] dark:text-[#F4F1EC] leading-[1.1] text-balance">
              Triển Lãm Ảnh, Video &amp; Kỷ Niệm Đời Thường
            </h1>
            <p className="text-sm sm:text-base text-[#5E5852] dark:text-[#A8A29E] leading-relaxed text-pretty">
              15 khung hình &amp; video timelapse đối thoại giữa nghệ thuật Cổ Phong, Hoa Đào, chân
              dung đời thực và những khoảnh khắc đồng đội tại MISA. Toàn bộ media được nén chuẩn
              WebP &amp; H.264 MP4 (giảm hơn 94% dung lượng gốc) giúp tải trang tức thì.
            </p>
          </div>
        </div>

        {/* Workspace Filter Tabs */}
        <div
          id="gallery-filters"
          role="tablist"
          aria-label="Lọc bộ sưu tập ảnh theo chủ đề"
          className="inline-flex flex-wrap items-center gap-1 p-1 rounded-lg bg-[#EFEAE2] dark:bg-[#17171C] border border-[#E6E0D6] dark:border-[#27262B]"
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
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-[#27262B] text-[#181615] dark:text-[#F4F1EC] shadow-sm'
                    : 'text-[#5E5852] dark:text-[#A8A29E] hover:text-[#181615] dark:hover:text-[#F4F1EC]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Editorial Bento Grid */}
      <div id="gallery-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
        {visibleArtworks.map((artwork) => {
          const isVideo = artwork.mediaType === 'video';

          if (isVideo) {
            const isPlayingInline = inlinePlayingVideoId === artwork.id;
            return (
              <figure
                key={artwork.id}
                data-gallery-card="true"
                className="md:col-span-2 lg:col-span-12 rounded-2xl overflow-hidden border border-[#E6E0D6] dark:border-[#27262B] bg-white dark:bg-[#141418] grid grid-cols-1 lg:grid-cols-12"
              >
                <div className="lg:col-span-5 relative aspect-[4/3] sm:aspect-[16/10] lg:aspect-auto lg:min-h-[380px] bg-[#141214] overflow-hidden">
                  {isPlayingInline ? (
                    <video
                      src={artwork.src}
                      poster={artwork.posterSrc}
                      controls
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setInlinePlayingVideoId(artwork.id)}
                      aria-label={`Phát video ${artwork.title}`}
                      className="relative w-full h-full block group cursor-pointer"
                    >
                      <img
                        src={artwork.posterSrc || artwork.src}
                        alt={artwork.alt}
                        width={artwork.width}
                        height={artwork.height}
                        loading="eager"
                        decoding="sync"
                        className="w-full h-full object-cover object-[50%_55%] transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                        <span className="w-14 h-14 rounded-full bg-[#9F1239]/90 hover:bg-[#9F1239] text-white border border-white/30 flex items-center justify-center shadow-lg transition-transform group-hover:scale-105">
                          <Play className="w-6 h-6 ml-0.5" aria-hidden="true" />
                        </span>
                      </div>
                    </button>
                  )}
                </div>

                <figcaption className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs text-[#5E5852] dark:text-[#A8A29E]">
                      <span className="inline-flex items-center gap-1.5 text-[#9F1239] dark:text-[#FB7185] font-medium">
                        <Film className="w-3.5 h-3.5" aria-hidden="true" />
                        Video Spotlight
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{artwork.specs.aspect}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{artwork.specs.fileSize}</span>
                    </div>

                    <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#181615] dark:text-[#F4F1EC] leading-snug">
                      <button
                        type="button"
                        onClick={() => onSelectArtwork(artwork)}
                        className="text-left hover:text-[#9F1239] dark:hover:text-[#FB7185] transition-colors cursor-pointer"
                      >
                        {artwork.title}
                      </button>
                    </h2>

                    <p className="text-sm sm:text-base text-[#5E5852] dark:text-[#A8A29E] leading-relaxed max-w-2xl">
                      {artwork.story}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#EFEAE2] dark:border-[#232227]">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#5E5852] dark:text-[#A8A29E]">
                      <span>{artwork.specs.concept}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{artwork.year}</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {!isPlayingInline && (
                        <button
                          type="button"
                          onClick={() => setInlinePlayingVideoId(artwork.id)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#9F1239] hover:bg-[#881337] text-white text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Phát Tại Chỗ</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onSelectArtwork(artwork)}
                        aria-label={`Xem chi tiết tác phẩm ${artwork.title}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#D8D0C5] dark:border-[#2E2D33] hover:border-[#9F1239] dark:hover:border-[#FB7185] text-xs font-medium text-[#181615] dark:text-[#F4F1EC] transition-colors cursor-pointer"
                      >
                        <Expand className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Toàn Màn Hình</span>
                      </button>
                    </div>
                  </div>
                </figcaption>
              </figure>
            );
          }

          const isLandscape = artwork.aspectType === 'landscape';
          let colSpanClass = 'md:col-span-1 lg:col-span-3';
          let aspectClass = 'aspect-[3/4]';

          if (isLandscape) {
            colSpanClass = 'md:col-span-2 lg:col-span-6';
            aspectClass = 'aspect-[16/10]';
          } else if (nonVideoPortraitCount === 2) {
            colSpanClass = 'md:col-span-1 lg:col-span-6';
            aspectClass = 'aspect-[4/3]';
          } else if (nonVideoPortraitCount === 3) {
            colSpanClass = 'md:col-span-1 lg:col-span-4';
            aspectClass = 'aspect-[3/4]';
          } else if (visibleArtworks.length === 1) {
            colSpanClass = 'md:col-span-2 lg:col-span-8 lg:col-start-3';
          }

          const objectPosClass =
            artwork.objectPosition === 'center' ? 'object-center' : 'object-top';
          const hasFailed = failedImages[artwork.id];

          return (
            <figure
              key={artwork.id}
              data-gallery-card="true"
              className={`${colSpanClass} group flex flex-col justify-between rounded-2xl overflow-hidden border border-[#E6E0D6] dark:border-[#27262B] bg-white dark:bg-[#141418] transition-colors`}
            >
              <button
                type="button"
                onClick={() => onSelectArtwork(artwork)}
                aria-label={`Xem chi tiết tác phẩm ${artwork.title}`}
                className={`relative w-full ${aspectClass} overflow-hidden bg-[#1D1A18] block text-left cursor-pointer`}
              >
                {hasFailed ? (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#2B1F1E] to-[#141214] text-[#F4F1EC]">
                    <p className="font-display text-xl font-semibold">{artwork.title}</p>
                    <p className="text-xs text-[#A8A29E] mt-1">{artwork.specs.format}</p>
                  </div>
                ) : (
                  <img
                    src={artwork.src}
                    alt={artwork.alt}
                    width={artwork.width}
                    height={artwork.height}
                    loading="eager"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    onError={() =>
                      setFailedImages((prev) => ({ ...prev, [artwork.id]: true }))
                    }
                    className={`w-full h-full object-cover ${objectPosClass} transition-transform duration-500 group-hover:scale-[1.03]`}
                  />
                )}

                <span className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Expand className="w-4 h-4" aria-hidden="true" />
                </span>
              </button>

              <figcaption className="p-5 space-y-2 flex-1 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-[#5E5852] dark:text-[#A8A29E] whitespace-nowrap overflow-hidden">
                    <span className="text-[#9F1239] dark:text-[#FB7185] font-medium truncate">
                      {artwork.categoryLabel}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums shrink-0">{artwork.specs.aspect}</span>
                  </div>

                  <h2 className="font-display text-xl font-bold text-[#181615] dark:text-[#F4F1EC] leading-snug">
                    <button
                      type="button"
                      onClick={() => onSelectArtwork(artwork)}
                      className="text-left hover:text-[#9F1239] dark:hover:text-[#FB7185] transition-colors cursor-pointer"
                    >
                      {artwork.title}
                    </button>
                  </h2>

                  <p className="text-xs sm:text-sm text-[#5E5852] dark:text-[#A8A29E] leading-relaxed line-clamp-3">
                    {artwork.story}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-[#EFEAE2] dark:border-[#232227] flex items-center justify-between text-xs text-[#5E5852] dark:text-[#A8A29E]">
                  <span className="truncate">{artwork.specs.concept}</span>
                  <span className="font-mono tabular-nums shrink-0 ml-2">{artwork.year}</span>
                </div>
              </figcaption>
            </figure>
          );
        })}
      </div>

      {/* Exhibition Cross-Link Strip back to Profile */}
      <div className="p-6 sm:p-8 rounded-2xl border border-[#E6E0D6] dark:border-[#27262B] bg-white dark:bg-[#141418] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-medium text-[#9F1239] dark:text-[#FB7185]">
            Hồ Sơ Kỹ Thuật &amp; Kinh Nghiệm
          </p>
          <p className="font-display text-2xl font-bold text-[#181615] dark:text-[#F4F1EC]">
            Xem Nền Tảng Backend .NET &amp; Dự Án Hệ Thống Doanh Nghiệp
          </p>
        </div>
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            onBackToProfile();
          }}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#181615] hover:bg-[#2E2A28] dark:bg-[#F4F1EC] dark:hover:bg-[#E5E0D8] text-[#FAF8F5] dark:text-[#0B0B0E] font-semibold text-sm transition-colors whitespace-nowrap shrink-0"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Về Trang Hồ Sơ</span>
        </a>
      </div>
    </section>
  );
}
