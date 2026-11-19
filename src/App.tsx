/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import { FaqAndCta, GlobalFooter } from './components/FaqAndFooter.tsx';
import { GallerySection } from './components/GallerySection.tsx';
import { HeroSection } from './components/HeroSection.tsx';
import { InteractiveTerminal } from './components/InteractiveTerminal.tsx';
import { LightboxModal } from './components/LightboxModal.tsx';
import { ProjectsSection } from './components/ProjectsSection.tsx';
import { SkillsSection } from './components/SkillsSection.tsx';
import { TopBarAndHeader } from './components/TopBarAndHeader.tsx';
import { GALLERY_ARTWORKS } from './data/portfolioData.ts';
import {
  AppRoute,
  ArtworkItem,
  buildCanonicalUrl,
  getNextGalleryIndex,
  getPrevGalleryIndex,
  getRoutePath,
  getRouteSeoMeta,
  parseAppRoute,
  resolveInitialTheme,
  resolveNextTheme,
  ThemeMode,
} from './utils/portfolioLogic.ts';

const THEME_STORAGE_KEY = 'thuanle-portfolio-theme';

export default function App() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      return resolveInitialTheme(localStorage.getItem(THEME_STORAGE_KEY));
    } catch {
      return 'light';
    }
  });

  const [activeRoute, setActiveRoute] = useState<AppRoute>(() =>
    parseAppRoute(window.location.pathname, window.location.hash)
  );
  const [activeArtworkId, setActiveArtworkId] = useState<string | null>(null);

  useEffect(() => {
    const handlePopState = () => {
      setActiveRoute(parseAppRoute(window.location.pathname, window.location.hash));
      setActiveArtworkId(null);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.remove('light');
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage failures in restricted contexts
    }
  }, [theme]);

  useEffect(() => {
    const seoMeta = getRouteSeoMeta(activeRoute);
    document.title = seoMeta.title;

    const canonicalUrl = buildCanonicalUrl(window.location.origin, seoMeta.path);
    const canonicalLink = document.getElementById('canonical-link');
    if (canonicalLink instanceof HTMLLinkElement) {
      canonicalLink.href = canonicalUrl;
    }

    const metaDesc = document.getElementById('meta-description');
    if (metaDesc instanceof HTMLMetaElement) {
      metaDesc.content = seoMeta.description;
    }

    const ogTitle = document.getElementById('og-title');
    if (ogTitle instanceof HTMLMetaElement) {
      ogTitle.content = seoMeta.title;
    }

    const ogDesc = document.getElementById('og-description');
    if (ogDesc instanceof HTMLMetaElement) {
      ogDesc.content = seoMeta.description;
    }

    const ogUrl = document.getElementById('og-url');
    if (ogUrl instanceof HTMLMetaElement) {
      ogUrl.content = canonicalUrl;
    }

    const twitterTitle = document.getElementById('twitter-title');
    if (twitterTitle instanceof HTMLMetaElement) {
      twitterTitle.content = seoMeta.title;
    }

    const twitterDesc = document.getElementById('twitter-description');
    if (twitterDesc instanceof HTMLMetaElement) {
      twitterDesc.content = seoMeta.description;
    }
  }, [activeRoute]);

  const handleNavigate = useCallback(
    (nextRoute: AppRoute, sectionId?: string) => {
      const targetPath = getRoutePath(nextRoute);
      const nextUrl = sectionId ? `${targetPath}#${sectionId}` : targetPath;
      if (window.location.pathname + window.location.hash !== nextUrl) {
        window.history.pushState({}, '', nextUrl);
      }
      setActiveRoute(nextRoute);
      setActiveArtworkId(null);

      if (sectionId) {
        requestAnimationFrame(() => {
          setTimeout(() => {
            const target = document.getElementById(sectionId);
            if (target) {
              target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }, 40);
        });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    []
  );

  const handleToggleTheme = () => {
    setTheme((prev) => resolveNextTheme(prev));
  };

  const activeIndex = activeArtworkId
    ? GALLERY_ARTWORKS.findIndex((item) => item.id === activeArtworkId)
    : -1;
  const activeArtwork = activeIndex >= 0 ? GALLERY_ARTWORKS[activeIndex] : null;

  const handleOpenArtwork = useCallback((artwork: ArtworkItem) => {
    setActiveArtworkId(artwork.id);
  }, []);

  const handleCloseLightbox = useCallback(() => {
    setActiveArtworkId(null);
  }, []);

  const handlePrevArtwork = useCallback(() => {
    if (activeIndex < 0) return;
    const prevIdx = getPrevGalleryIndex(activeIndex, GALLERY_ARTWORKS.length);
    if (prevIdx >= 0) {
      setActiveArtworkId(GALLERY_ARTWORKS[prevIdx].id);
    }
  }, [activeIndex]);

  const handleNextArtwork = useCallback(() => {
    if (activeIndex < 0) return;
    const nextIdx = getNextGalleryIndex(activeIndex, GALLERY_ARTWORKS.length);
    if (nextIdx >= 0) {
      setActiveArtworkId(GALLERY_ARTWORKS[nextIdx].id);
    }
  }, [activeIndex]);

  return (
    <div className="min-h-screen editorial-grid-bg flex flex-col">
      <TopBarAndHeader activeRoute={activeRoute} onNavigate={handleNavigate} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 space-y-16 sm:space-y-20 pb-8">
        {activeRoute === 'gallery' ? (
          <GallerySection
            theme={theme}
            onToggleTheme={handleToggleTheme}
            onSelectArtwork={handleOpenArtwork}
            onBackToProfile={() => handleNavigate('profile', 'overview')}
          />
        ) : (
          <>
            <HeroSection onOpenGalleryScreen={() => handleNavigate('gallery')} />
            <ProjectsSection />
            <SkillsSection />
            <InteractiveTerminal />
            <FaqAndCta />
          </>
        )}
      </main>

      <GlobalFooter
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onNavigate={handleNavigate}
      />

      <LightboxModal
        artwork={activeArtwork}
        currentIndex={activeIndex}
        totalCount={GALLERY_ARTWORKS.length}
        onClose={handleCloseLightbox}
        onPrev={handlePrevArtwork}
        onNext={handleNextArtwork}
      />
    </div>
  );
}
