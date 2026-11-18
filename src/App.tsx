/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { GlobalFooter, RecruiterCta } from './components/CtaAndFooter.tsx';
import { HeroSection } from './components/HeroSection.tsx';
import { InteractiveTerminal } from './components/InteractiveTerminal.tsx';
import { ProjectsSection } from './components/ProjectsSection.tsx';
import { SkillsSection } from './components/SkillsSection.tsx';
import { TopBarAndHeader } from './components/TopBarAndHeader.tsx';
import { WoodIdentityAndStats } from './components/WoodIdentityAndStats.tsx';
import { resolveInitialTheme, resolveNextTheme, ThemeMode } from './utils/portfolioLogic.ts';

const THEME_STORAGE_KEY = 'thuanle-portfolio-theme';

export default function App() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      return resolveInitialTheme(localStorage.getItem(THEME_STORAGE_KEY));
    } catch {
      return 'light';
    }
  });

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
      // Ignore storage errors in sandboxed iframes
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => resolveNextTheme(prev));
  };

  return (
    <div className="min-h-screen bg-leaf-grid relative flex flex-col">
      {/* Ambient top sunlight aura */}
      <div className="absolute top-0 left-0 right-0 h-[480px] glow-sunlight pointer-events-none" />

      <TopBarAndHeader theme={theme} onToggleTheme={handleToggleTheme} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-10 space-y-16 relative z-10">
        <HeroSection />
        <WoodIdentityAndStats />
        <ProjectsSection />
        <SkillsSection />
        <InteractiveTerminal />
        <RecruiterCta />
      </main>

      <GlobalFooter />
    </div>
  );
}
