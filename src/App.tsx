/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import { CvPdfSection } from './components/CvPdfSection.tsx';
import { FaqAndCta, GlobalFooter } from './components/FaqAndFooter.tsx';
import { GallerySection } from './components/GallerySection.tsx';
import { HeroSection } from './components/HeroSection.tsx';
import { InteractiveTerminal } from './components/InteractiveTerminal.tsx';
import { LightboxModal } from './components/LightboxModal.tsx';
import { ProjectsSection } from './components/ProjectsSection.tsx';
import { SkillsSection } from './components/SkillsSection.tsx';
import { GameHubSection } from './components/GameHubSection.tsx';
import { TopBarAndHeader } from './components/TopBarAndHeader.tsx';
import { GALLERY_ARTWORKS } from './data/portfolioData.ts';
import {
  AppRoute,
  ArtworkItem,
  buildCanonicalUrl,
  buildStructuredDataGraph,
  getNextGalleryIndex,
  getPrevGalleryIndex,
  getRoutePath,
  getRouteSeoMeta,
  parseAppRoute,
  ProfileTemplateId,
  resolveInitialTheme,
  resolveNextTheme,
  resolveTemplateSelection,
  SHOWCASE_TEMPLATE_IDS,
  ThemeMode,
} from './utils/portfolioLogic.ts';

const THEME_STORAGE_KEY = 'thuanle-portfolio-theme';
const PROFILE_TEMPLATE_KEY = 'thuanle-profile-template';

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
  const [profileTemplate, setProfileTemplate] = useState<ProfileTemplateId>(() => {
    try {
      return resolveTemplateSelection(
        localStorage.getItem(PROFILE_TEMPLATE_KEY),
        SHOWCASE_TEMPLATE_IDS,
        'modern'
      );
    } catch {
      return 'modern';
    }
  });
  const [activeArtworkId, setActiveArtworkId] = useState<string | null>(null);
  const [lightboxScope, setLightboxScope] = useState<ArtworkItem[]>(GALLERY_ARTWORKS);

  const handleChangeProfileTemplate = useCallback((nextTemplate: ProfileTemplateId) => {
    setProfileTemplate(nextTemplate);
    try {
      localStorage.setItem(PROFILE_TEMPLATE_KEY, nextTemplate);
    } catch {
      // Ignore storage errors
    }
  }, []);

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
    const ogCoverUrl = buildCanonicalUrl(window.location.origin, '/og-cover.jpg?v=2');

    const canonicalLink = document.getElementById('canonical-link');
    if (canonicalLink instanceof HTMLLinkElement) {
      canonicalLink.href = canonicalUrl;
    }

    const setMeta = (id: string, value: string) => {
      const el = document.getElementById(id);
      if (el instanceof HTMLMetaElement) {
        el.content = value;
      }
    };

    setMeta('meta-description', seoMeta.description);
    setMeta('meta-keywords', seoMeta.keywords);
    setMeta('og-type', seoMeta.ogType);
    setMeta('og-title', seoMeta.title);
    setMeta('og-description', seoMeta.description);
    setMeta('og-url', canonicalUrl);
    setMeta('og-image', ogCoverUrl);
    setMeta('og-image-alt', seoMeta.ogImageAlt);
    setMeta('twitter-title', seoMeta.title);
    setMeta('twitter-description', seoMeta.description);
    setMeta('twitter-image', ogCoverUrl);
    setMeta('twitter-image-alt', seoMeta.ogImageAlt);

    const ldJsonEl = document.getElementById('structured-data-jsonld');
    if (ldJsonEl) {
      ldJsonEl.textContent = JSON.stringify(
        buildStructuredDataGraph(window.location.origin, activeRoute)
      );
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

  const activeList = lightboxScope.length > 0 ? lightboxScope : GALLERY_ARTWORKS;
  const activeIndex = activeArtworkId
    ? activeList.findIndex((item) => item.id === activeArtworkId)
    : -1;
  const activeArtwork = activeIndex >= 0 ? activeList[activeIndex] : null;

  const handleOpenArtwork = useCallback((artwork: ArtworkItem, scopeList?: ArtworkItem[]) => {
    if (scopeList && scopeList.length > 0) {
      setLightboxScope(scopeList);
    } else {
      setLightboxScope(GALLERY_ARTWORKS);
    }
    setActiveArtworkId(artwork.id);
  }, []);

  const handleCloseLightbox = useCallback(() => {
    setActiveArtworkId(null);
  }, []);

  const handlePrevArtwork = useCallback(() => {
    if (activeIndex < 0) return;
    const prevIdx = getPrevGalleryIndex(activeIndex, activeList.length);
    if (prevIdx >= 0) {
      setActiveArtworkId(activeList[prevIdx].id);
    }
  }, [activeIndex, activeList]);

  const handleNextArtwork = useCallback(() => {
    if (activeIndex < 0) return;
    const nextIdx = getNextGalleryIndex(activeIndex, activeList.length);
    if (nextIdx >= 0) {
      setActiveArtworkId(activeList[nextIdx].id);
    }
  }, [activeIndex, activeList]);

  const handleSelectLightboxIndex = useCallback(
    (index: number) => {
      const target = activeList[index];
      if (target) {
        setActiveArtworkId(target.id);
      }
    },
    [activeList]
  );

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
        ) : activeRoute === 'cv' ? (
          <CvPdfSection
            theme={theme}
            onToggleTheme={handleToggleTheme}
            onNavigate={handleNavigate}
          />
        ) : activeRoute === 'game' ? (
          <GameHubSection
            theme={theme}
            onToggleTheme={handleToggleTheme}
          />
        ) : (
          <>
            <HeroSection
              theme={theme}
              template={profileTemplate}
              onChangeTemplate={handleChangeProfileTemplate}
              onToggleTheme={handleToggleTheme}
              onOpenGalleryScreen={() => handleNavigate('gallery')}
            />
            <ProjectsSection template={profileTemplate} />
            <SkillsSection template={profileTemplate} />
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
        artworks={activeList}
        currentIndex={activeIndex}
        totalCount={activeList.length}
        onClose={handleCloseLightbox}
        onPrev={handlePrevArtwork}
        onNext={handleNextArtwork}
        onSelectIndex={handleSelectLightboxIndex}
      />
    </div>
  );
}
