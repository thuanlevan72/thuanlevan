import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AI_AGENT_EXPERIENCE,
  GALLERY_ARTWORKS,
  HERO_METRICS,
  PORTFOLIO_PROFILE,
  PORTFOLIO_PROJECTS,
  SKILL_GROUPS,
} from '../data/portfolioData.ts';
import {
  buildCanonicalUrl,
  buildCvPlainText,
  buildStructuredDataGraph,
  executeCliCommand,
  filterGalleryItems,
  filterProjects,
  getGalleryCategoryCounts,
  getNextGalleryIndex,
  getPrevGalleryIndex,
  getProjectCategoryCounts,
  getRoutePath,
  getRouteSeoMeta,
  parseAppRoute,
  resolveInitialTheme,
  resolveNextTheme,
} from './portfolioLogic.ts';

test('resolveInitialTheme and resolveNextTheme manage theme transitions cleanly', () => {
  assert.equal(resolveInitialTheme(undefined), 'light');
  assert.equal(resolveInitialTheme('dark'), 'dark');
  assert.equal(resolveNextTheme('light'), 'dark');
  assert.equal(resolveNextTheme('dark'), 'light');
});

test('parseAppRoute, getRoutePath, and getRouteSeoMeta separate profile, cv, and exhibition routes', () => {
  assert.equal(parseAppRoute('/'), 'profile');
  assert.equal(parseAppRoute('/trien-lam'), 'gallery');
  assert.equal(parseAppRoute('/trien-lam/'), 'gallery');
  assert.equal(parseAppRoute('/', '#trien-lam'), 'gallery');
  assert.equal(parseAppRoute('/cv'), 'cv');
  assert.equal(parseAppRoute('/cv-pdf/'), 'cv');
  assert.equal(parseAppRoute('/', '#cv'), 'cv');

  assert.equal(getRoutePath('profile'), '/');
  assert.equal(getRoutePath('gallery'), '/trien-lam');
  assert.equal(getRoutePath('cv'), '/cv');

  const galleryMeta = getRouteSeoMeta('gallery');
  const cvMeta = getRouteSeoMeta('cv');
  const profileMeta = getRouteSeoMeta('profile');
  assert.match(galleryMeta.title, /Triển Lãm/);
  assert.equal(galleryMeta.path, '/trien-lam');
  assert.match(cvMeta.title, /CV PDF/);
  assert.equal(cvMeta.path, '/cv');
  assert.match(profileMeta.title, /Kỹ Sư Senior \.NET/);
  assert.equal(profileMeta.path, '/');
});

test('buildCanonicalUrl strips trailing slashes safely for SEO canonical tags', () => {
  assert.equal(
    buildCanonicalUrl('https://thuanlevan.vercel.app/', '/'),
    'https://thuanlevan.vercel.app/'
  );
  assert.equal(
    buildCanonicalUrl('https://thuanlevan.vercel.app', 'trien-lam'),
    'https://thuanlevan.vercel.app/trien-lam'
  );
});

test('filterGalleryItems filters all 28 exhibition media items accurately', () => {
  const counts = getGalleryCategoryCounts(GALLERY_ARTWORKS);
  assert.deepEqual(counts, {
    all: 28,
    imperial: 0,
    poetic: 1,
    portrait: 11,
    moments: 16,
  });

  assert.equal(filterGalleryItems(GALLERY_ARTWORKS, 'all').length, 28);
  assert.equal(filterGalleryItems(GALLERY_ARTWORKS, 'imperial').length, 0);
  assert.equal(filterGalleryItems(GALLERY_ARTWORKS, 'poetic').length, 1);
  assert.equal(filterGalleryItems(GALLERY_ARTWORKS, 'portrait').length, 11);
  assert.equal(filterGalleryItems(GALLERY_ARTWORKS, 'moments').length, 16);
});

test('lightbox next/prev index helpers wrap cleanly across gallery boundaries', () => {
  assert.equal(getNextGalleryIndex(0, 28), 1);
  assert.equal(getNextGalleryIndex(27, 28), 0);
  assert.equal(getPrevGalleryIndex(0, 28), 27);
  assert.equal(getPrevGalleryIndex(3, 28), 2);
  assert.equal(getNextGalleryIndex(0, 0), -1);
  assert.equal(getPrevGalleryIndex(0, 0), -1);
});

test('filterProjects filters all 6 production projects accurately', () => {
  const counts = getProjectCategoryCounts(PORTFOLIO_PROJECTS);
  assert.deepEqual(counts, {
    all: 6,
    ai: 1,
    fintech: 2,
    healthcare: 3,
  });
  assert.equal(filterProjects(PORTFOLIO_PROJECTS, 'all').length, 6);
  assert.equal(filterProjects(PORTFOLIO_PROJECTS, 'ai').length, 1);
  assert.equal(filterProjects(PORTFOLIO_PROJECTS, 'fintech').length, 2);
  assert.equal(filterProjects(PORTFOLIO_PROJECTS, 'healthcare').length, 3);
});

test('executeCliCommand handles gallery, dotnet, clear, and unknown inputs', () => {
  assert.deepEqual(executeCliCommand('   '), { action: 'noop' });
  assert.deepEqual(executeCliCommand('clear'), { action: 'clear' });

  const galleryRes = executeCliCommand('gallery');
  assert.equal(galleryRes.action, 'append');
  if (galleryRes.action === 'append') {
    assert.match(galleryRes.responseText, /Cố Phán Di Quang Thái/);
    assert.match(galleryRes.responseText, /Coding Timelapse/);
  }

  const dotnetRes = executeCliCommand('dotnet --info');
  assert.equal(dotnetRes.action, 'append');
  if (dotnetRes.action === 'append') {
    assert.match(dotnetRes.responseText, /8\.0\.300/);
  }

  const cvRes = executeCliCommand('cv');
  assert.equal(cvRes.action, 'append');
  if (cvRes.action === 'append') {
    assert.match(cvRes.responseText, /Lê Văn Thuận/);
    assert.match(cvRes.responseText, /\/cv/);
  }

  const unknownRes = executeCliCommand('invalid-cmd');
  assert.equal(unknownRes.action, 'append');
  if (unknownRes.action === 'append') {
    assert.equal(unknownRes.responseToneClass, 'text-rose-400');
  }

  const aiAgentsRes = executeCliCommand('ai-agents');
  assert.equal(aiAgentsRes.action, 'append');
  if (aiAgentsRes.action === 'append') {
    assert.match(aiAgentsRes.responseText, /Claude/);
    assert.match(aiAgentsRes.responseText, /Gemini/);
    assert.match(aiAgentsRes.responseText, /Codex/);
    assert.match(aiAgentsRes.responseText, /Grok/);
  }
});

test('buildCvPlainText builds structured Vietnamese CV content including AI agents', () => {
  const plainText = buildCvPlainText({
    profile: PORTFOLIO_PROFILE,
    metrics: HERO_METRICS,
    projects: PORTFOLIO_PROJECTS,
    skillGroups: SKILL_GROUPS,
    aiAgents: AI_AGENT_EXPERIENCE,
  });

  assert.match(plainText, /LÊ VĂN THUẬN/);
  assert.match(plainText, /MISA OneAI for Family/);
  assert.match(plainText, /Smart Form Agribank/);
  assert.match(plainText, /Phenikaa MEC/);
  assert.match(plainText, /C# \.NET 8/);
  assert.match(plainText, /Claude/);
  assert.match(plainText, /Gemini/);
  assert.match(plainText, /Codex/);
  assert.match(plainText, /Grok/);
});

test('buildStructuredDataGraph outputs valid Schema.org Brand logo, BreadcrumbList, and ProfilePage/CollectionPage', () => {
  const profileGraph = buildStructuredDataGraph('https://thuanlevan.vercel.app', 'profile');
  const brandNode = profileGraph['@graph'].find((n) => n['@type'] === 'Brand');
  assert.ok(brandNode && 'logo' in brandNode && brandNode.logo);
  assert.equal(brandNode.logo.url, 'https://thuanlevan.vercel.app/brand-logo.png');
  assert.equal(brandNode.logo.width, 512);

  const profilePage = profileGraph['@graph'].find((n) => n['@type'] === 'ProfilePage');
  assert.ok(profilePage);
  assert.equal(profilePage.url, 'https://thuanlevan.vercel.app/');

  const galleryGraph = buildStructuredDataGraph('https://thuanlevan.vercel.app/', 'gallery');
  const collectionPage = galleryGraph['@graph'].find((n) => n['@type'] === 'CollectionPage');
  assert.ok(collectionPage);
  assert.equal(collectionPage.url, 'https://thuanlevan.vercel.app/trien-lam');
});
