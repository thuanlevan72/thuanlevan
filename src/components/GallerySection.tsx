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
      <div className="space-y-6 border-b border-[#D7E2EE] dark:border-[#1B2B44] pb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
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
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#CBD8E6] dark:border-[#1E3250] bg-white dark:bg-[#0B1220] text-xs font-medium text-[#070B14] dark:text-[#F1F5F9] hover:border-[#0284C7] dark:hover:border-[#38BDF8] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {theme === 'dark' ? (
              <Moon className="w-3.5 h-3.5 text-[#38BDF8]" aria-hidden="true" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-[#0284C7]" aria-hidden="true" />
            )}
            <span id="theme-text">{theme === 'dark' ? 'Nền Tối' : 'Nền Sáng'}</span>
          </button>
        </div>

        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <p className="text-xs sm:text-sm font-medium text-[#0369A1] dark:text-[#38BDF8]">
              Phòng Trưng Bày Độc Lập · Tác Giả Thuận Lê
            </p>
            <h1 className="font-display font-bold text-4xl sm:text-5xl text-[#070B14] dark:text-[#F1F5F9] leading-[1.1] text-balance">
              Triển Lãm Ảnh, Video &amp; Kỷ Niệm Đời Thường
            </h1>
            <p className="text-sm sm:text-base text-[#475569] dark:text-[#94A3B8] leading-relaxed text-pretty">
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
          className="inline-flex flex-wrap items-center gap-1 p-1 rounded-lg bg-[#E6EEF7] dark:bg-[#0E182B] border border-[#D7E2EE] dark:border-[#1B2B44]"
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
                    ? 'bg-white dark:bg-[#162642] text-[#070B14] dark:text-[#F1F5F9] shadow-sm'
                    : 'text-[#475569] dark:text-[#94A3B8] hover:text-[#070B14] dark:hover:text-[#F1F5F9]'
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
                className="md:col-span-2 lg:col-span-12 rounded-2xl overflow-hidden border border-[#D7E2EE] dark:border-[#1B2B44] bg-white dark:bg-[#0B1220] grid grid-cols-1 lg:grid-cols-12"
              >
                <div className="lg:col-span-5 relative aspect-[4/3] sm:aspect-[16/10] lg:aspect-auto lg:min-h-[380px] bg-[#060B14] overflow-hidden">
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
                      <div className="absolute inset-0 bg-[#040914]/35 group-hover:bg-[#040914]/45 transition-colors flex items-center justify-center">
                        <span className="w-14 h-14 rounded-full bg-[#0284C7]/90 hover:bg-[#0284C7] text-white border border-white/30 flex items-center justify-center shadow-lg transition-transform group-hover:scale-105">
                          <Play className="w-6 h-6 ml-0.5" aria-hidden="true" />
                        </span>
                      </div>
                    </button>
                  )}
                </div>

                <figcaption className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs text-[#475569] dark:text-[#94A3B8]">
                      <span className="inline-flex items-center gap-1.5 text-[#1D4ED8] dark:text-[#38BDF8] font-medium">
                        <Film className="w-3.5 h-3.5" aria-hidden="true" />
                        Video Spotlight
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{artwork.specs.aspect}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{artwork.specs.fileSize}</span>
                    </div>

                    <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#070B14] dark:text-[#F1F5F9] leading-snug">
                      <button
                        type="button"
                        onClick={() => onSelectArtwork(artwork)}
                        className="text-left hover:text-[#1D4ED8] dark:hover:text-[#38BDF8] transition-colors cursor-pointer"
                      >
                        {artwork.title}
                      </button>
                    </h2>

                    <p className="text-sm sm:text-base text-[#475569] dark:text-[#94A3B8] leading-relaxed max-w-2xl">
                      {artwork.story}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#E6EEF7] dark:border-[#17253B]">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#475569] dark:text-[#94A3B8]">
                      <span>{artwork.specs.concept}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{artwork.year}</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {!isPlayingInline && (
                        <button
                          type="button"
                          onClick={() => setInlinePlayingVideoId(artwork.id)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] dark:bg-[#0284C7] dark:hover:bg-[#0369A1] text-white text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Phát Tại Chỗ</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onSelectArtwork(artwork)}
                        aria-label={`Xem chi tiết tác phẩm ${artwork.title}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#CBD8E6] dark:border-[#1E3250] hover:border-[#0284C7] dark:hover:border-[#38BDF8] text-xs font-medium text-[#0A192F] dark:text-[#F1F5F9] transition-colors cursor-pointer"
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
              className={`${colSpanClass} group flex flex-col justify-between rounded-2xl overflow-hidden border border-[#D7E2EE] dark:border-[#1B2B44] bg-white dark:bg-[#0B1220] hover:border-[#0284C7]/60 dark:hover:border-[#38BDF8]/60 transition-colors`}
            >
              <button
                type="button"
                onClick={() => onSelectArtwork(artwork)}
                aria-label={`Xem chi tiết tác phẩm ${artwork.title}`}
                className={`relative w-full ${aspectClass} overflow-hidden bg-[#060B14] block text-left cursor-pointer`}
              >
                {hasFailed ? (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#0A192F] to-[#05080F] text-[#F1F5F9]">
                    <p className="font-display text-xl font-semibold">{artwork.title}</p>
                    <p className="text-xs text-[#94A3B8] mt-1">{artwork.specs.format}</p>
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

                <span className="absolute top-3 right-3 w-9 h-9 rounded-full bg-[#05080F]/65 backdrop-blur-sm border border-[#38BDF8]/30 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Expand className="w-4 h-4" aria-hidden="true" />
                </span>
              </button>

              <figcaption className="p-5 space-y-2 flex-1 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-[#475569] dark:text-[#94A3B8] whitespace-nowrap overflow-hidden">
                    <span className="text-[#0369A1] dark:text-[#38BDF8] font-medium truncate">
                      {artwork.categoryLabel}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums shrink-0">{artwork.specs.aspect}</span>
                  </div>

                  <h2 className="font-display text-xl font-bold text-[#070B14] dark:text-[#F1F5F9] leading-snug">
                    <button
                      type="button"
                      onClick={() => onSelectArtwork(artwork)}
                      className="text-left hover:text-[#1D4ED8] dark:hover:text-[#38BDF8] transition-colors cursor-pointer"
                    >
                      {artwork.title}
                    </button>
                  </h2>

                  <p className="text-xs sm:text-sm text-[#475569] dark:text-[#94A3B8] leading-relaxed line-clamp-3">
                    {artwork.story}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-[#E6EEF7] dark:border-[#17253B] flex items-center justify-between text-xs text-[#475569] dark:text-[#94A3B8]">
                  <span className="truncate">{artwork.specs.concept}</span>
                  <span className="font-mono tabular-nums shrink-0 ml-2">{artwork.year}</span>
                </div>
              </figcaption>
            </figure>
          );
        })}
      </div>

      {/* Exhibition Cross-Link Strip back to Profile */}
      <div className="p-6 sm:p-8 rounded-2xl border border-[#D7E2EE] dark:border-[#1B2B44] bg-white dark:bg-[#0B1220] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-medium text-[#0369A1] dark:text-[#38BDF8]">
            Hồ Sơ Kỹ Thuật &amp; Kinh Nghiệm
          </p>
          <p className="font-display text-2xl font-bold text-[#070B14] dark:text-[#F1F5F9]">
            Xem Nền Tảng Backend .NET &amp; Dự Án Hệ Thống Doanh Nghiệp
          </p>
        </div>
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            onBackToProfile();
          }}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#0A192F] hover:bg-[#13294B] dark:bg-[#2563EB] dark:hover:bg-[#1D4ED8] text-white font-semibold text-sm transition-colors whitespace-nowrap shrink-0"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Về Trang Hồ Sơ</span>
        </a>
      </div>
    </section>
  );
}
