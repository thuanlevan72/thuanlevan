import Dexie, { type EntityTable } from 'dexie';
import {
  createStarterDrafts,
  resolveMelodyPlaybackMode,
  type SketchpadDraft,
  type SketchpadDraftVersion,
} from './lyricGrooveEngine.ts';

const FALLBACK_STORAGE_KEY = 'lyric-groove-sketchpad-drafts-v1';
const FALLBACK_VERSIONS_KEY = 'lyric-groove-sketchpad-versions-v1';

class LyricGrooveDatabase extends Dexie {
  drafts!: EntityTable<SketchpadDraft, 'id'>;
  versions!: EntityTable<SketchpadDraftVersion, 'id'>;

  constructor() {
    super('LyricGrooveSketchpadDB');
    this.version(1).stores({
      drafts: 'id, updatedAt, title',
    });
    this.version(2).stores({
      drafts: 'id, updatedAt, title',
      versions: 'id, draftId, savedAt, versionNumber',
    });
  }
}

let dbInstance: LyricGrooveDatabase | null = null;

function getDb(): LyricGrooveDatabase | null {
  if (typeof indexedDB === 'undefined') return null;
  if (!dbInstance) {
    dbInstance = new LyricGrooveDatabase();
  }
  return dbInstance;
}

function readFallbackDrafts(): SketchpadDraft[] | null {
  try {
    const raw = localStorage.getItem(FALLBACK_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

function writeFallbackDrafts(drafts: SketchpadDraft[]): void {
  try {
    localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(drafts));
  } catch {
    // Ignore storage quota / privacy errors
  }
}

const PIANO_SEED_KEY = 'lyric-groove-grand-piano-seed-v2';
const THANG_TU_SEED_KEY = 'lyric-groove-thang-tu-seed-v4';
const DI_VANG_SEED_KEY = 'lyric-groove-di-vang-nhat-nhoa-seed-v3';
const PHIA_SAU_SEED_KEY = 'lyric-groove-phia-sau-seed-v1';
const REMOVED_TRACKS_CLEANUP_KEY = 'lyric-groove-removed-tracks-v1';
const REMOVED_DRAFT_IDS = ['draft-khach-vang-lai', 'draft-khoang-cach-hai-ta-am'];

function normalizeDraftDefaults(draft: SketchpadDraft): SketchpadDraft {
  const melodyPlaybackMode = resolveMelodyPlaybackMode(draft);
  return {
    ...draft,
    backingPattern:
      draft.backingPattern ??
      (draft.backingInstrument === 'piano-ballad' ? 'auto-song' : 'rich-block'),
    sustainPedal: draft.sustainPedal ?? true,
    metronomeEnabled: draft.metronomeEnabled ?? false,
    melodyMuted: draft.melodyMuted ?? melodyPlaybackMode !== 'all',
    melodyPlaybackMode,
    mutedMelodySectionIds: Array.isArray(draft.mutedMelodySectionIds)
      ? draft.mutedMelodySectionIds
      : [],
  };
}

function upsertStarterDraft(
  result: SketchpadDraft[],
  starter: SketchpadDraft,
  newlyAdded: SketchpadDraft[]
): SketchpadDraft[] {
  const idx = result.findIndex((d) => d.id === starter.id);
  if (idx < 0) {
    newlyAdded.push(starter);
    return [starter, ...result];
  }
  const upgraded: SketchpadDraft = {
    ...result[idx],
    title: starter.title,
    keyRoot: starter.keyRoot,
    scaleMode: starter.scaleMode,
    mood: starter.mood,
    bpm: starter.bpm,
    drumPattern: starter.drumPattern,
    backingInstrument: starter.backingInstrument,
    backingPattern: starter.backingPattern,
    chordArpStyles: starter.chordArpStyles,
    melodyMuted: starter.melodyMuted,
    melodyPlaybackMode: starter.melodyPlaybackMode,
    mutedMelodySectionIds: starter.mutedMelodySectionIds ?? [],
    sections: starter.sections,
    melodyNotes: starter.melodyNotes,
    updatedAt: starter.updatedAt,
  };
  newlyAdded.push(upgraded);
  return [...result.slice(0, idx), upgraded, ...result.slice(idx + 1)];
}

function ensureStarterSeedsOnce(existing: SketchpadDraft[]): {
  drafts: SketchpadDraft[];
  newlyAdded: SketchpadDraft[];
  removedIds: string[];
} {
  let result = existing.map(normalizeDraftDefaults);
  const newlyAdded: SketchpadDraft[] = [];
  const removedIds: string[] = [];
  const starters = createStarterDrafts();

  try {
    if (!localStorage.getItem(REMOVED_TRACKS_CLEANUP_KEY)) {
      localStorage.setItem(REMOVED_TRACKS_CLEANUP_KEY, '1');
      result.forEach((d) => {
        if (REMOVED_DRAFT_IDS.includes(d.id)) {
          removedIds.push(d.id);
        }
      });
    }
    result = result.filter((d) => !REMOVED_DRAFT_IDS.includes(d.id));

    const pianoSeeded = localStorage.getItem(PIANO_SEED_KEY);
    const pianoStarter = starters.find((d) => d.id === 'draft-dem-pho-mua-piano');
    if (!pianoSeeded && pianoStarter) {
      localStorage.setItem(PIANO_SEED_KEY, '1');
      const idx = result.findIndex((d) => d.id === pianoStarter.id);
      if (idx < 0) {
        result = [pianoStarter, ...result];
        newlyAdded.push(pianoStarter);
      } else if (result[idx].melodyNotes.length <= 12) {
        const upgraded = { ...result[idx], melodyNotes: pianoStarter.melodyNotes };
        result[idx] = upgraded;
        newlyAdded.push(upgraded);
      }
    }

    const thangTuSeeded = localStorage.getItem(THANG_TU_SEED_KEY);
    const thangTuStarter = starters.find(
      (d) => d.id === 'draft-thang-tu-la-loi-noi-doi-cua-em'
    );
    if (!thangTuSeeded && thangTuStarter) {
      localStorage.setItem(THANG_TU_SEED_KEY, '1');
      result = upsertStarterDraft(result, thangTuStarter, newlyAdded);
    }

    const diVangSeeded = localStorage.getItem(DI_VANG_SEED_KEY);
    const diVangStarter = starters.find((d) => d.id === 'draft-di-vang-nhat-nhoa');
    if (!diVangSeeded && diVangStarter) {
      localStorage.setItem(DI_VANG_SEED_KEY, '1');
      result = upsertStarterDraft(result, diVangStarter, newlyAdded);
    }

    const phiaSauSeeded = localStorage.getItem(PHIA_SAU_SEED_KEY);
    const phiaSauStarter = starters.find((d) => d.id === 'draft-phia-sau-mot-co-gai');
    if (!phiaSauSeeded && phiaSauStarter) {
      localStorage.setItem(PHIA_SAU_SEED_KEY, '1');
      result = upsertStarterDraft(result, phiaSauStarter, newlyAdded);
    }

    const lofiStarter = starters.find((d) => d.id === 'draft-mua-ban-cong');
    if (lofiStarter) {
      const idx = result.findIndex((d) => d.id === lofiStarter.id);
      if (idx >= 0 && result[idx].melodyNotes.length <= 12) {
        const upgraded = { ...result[idx], melodyNotes: lofiStarter.melodyNotes };
        result[idx] = upgraded;
        newlyAdded.push(upgraded);
      }
    }
  } catch {
    // Ignore storage access errors
  }

  return { drafts: result, newlyAdded, removedIds };
}

export async function loadAllSketchpadDrafts(): Promise<SketchpadDraft[]> {
  const db = getDb();
  if (db) {
    try {
      const existing = await db.drafts.orderBy('updatedAt').reverse().toArray();
      if (existing.length > 0) {
        const { drafts, newlyAdded, removedIds } = ensureStarterSeedsOnce(existing);
        if (removedIds.length > 0) {
          await db.drafts.bulkDelete(removedIds);
        }
        if (newlyAdded.length > 0) {
          await db.drafts.bulkPut(newlyAdded);
        }
        writeFallbackDrafts(drafts);
        return drafts;
      }
      const starters = [...createStarterDrafts()].sort(
        (a, b) => b.updatedAt - a.updatedAt
      );
      await db.drafts.bulkPut(starters);
      writeFallbackDrafts(starters);
      return starters;
    } catch {
      // Fallback to localStorage below
    }
  }

  const cached = readFallbackDrafts();
  if (cached) {
    const { drafts } = ensureStarterSeedsOnce(
      cached.sort((a, b) => b.updatedAt - a.updatedAt)
    );
    writeFallbackDrafts(drafts);
    return drafts;
  }
  const starters = [...createStarterDrafts()].sort(
    (a, b) => b.updatedAt - a.updatedAt
  );
  writeFallbackDrafts(starters);
  return starters;
}

export async function saveSketchpadDraft(draft: SketchpadDraft): Promise<void> {
  const stamped: SketchpadDraft = { ...draft, updatedAt: Date.now() };
  const db = getDb();
  if (db) {
    try {
      await db.drafts.put(stamped);
    } catch {
      // Fallback continues below
    }
  }
  const current = readFallbackDrafts() ?? [];
  const idx = current.findIndex((d) => d.id === stamped.id);
  const next = idx >= 0 ? [...current.slice(0, idx), stamped, ...current.slice(idx + 1)] : [stamped, ...current];
  writeFallbackDrafts(next);
}

export async function deleteSketchpadDraft(id: string): Promise<void> {
  const db = getDb();
  if (db) {
    try {
      await db.drafts.delete(id);
      await db.versions.where('draftId').equals(id).delete();
    } catch {
      // Fallback continues below
    }
  }
  const current = readFallbackDrafts();
  if (current) {
    writeFallbackDrafts(current.filter((d) => d.id !== id));
  }
  const allVersions = readFallbackVersions();
  writeFallbackVersions(allVersions.filter((v) => v.draftId !== id));
}

function readFallbackVersions(): SketchpadDraftVersion[] {
  try {
    const raw = localStorage.getItem(FALLBACK_VERSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeFallbackVersions(versions: SketchpadDraftVersion[]): void {
  try {
    localStorage.setItem(FALLBACK_VERSIONS_KEY, JSON.stringify(versions));
  } catch {
    // Ignore storage quota errors
  }
}

function sortVersionsDesc(list: SketchpadDraftVersion[]): SketchpadDraftVersion[] {
  return [...list].sort(
    (a, b) => b.versionNumber - a.versionNumber || b.savedAt - a.savedAt
  );
}

export async function loadDraftVersions(
  draftId: string
): Promise<SketchpadDraftVersion[]> {
  const db = getDb();
  if (db) {
    try {
      const rows = await db.versions.where('draftId').equals(draftId).toArray();
      if (rows.length > 0) {
        return sortVersionsDesc(rows);
      }
    } catch {
      // Fallback below
    }
  }
  return sortVersionsDesc(
    readFallbackVersions().filter((v) => v.draftId === draftId)
  );
}

export async function appendDraftVersion(
  version: SketchpadDraftVersion,
  maxPerDraft = 30
): Promise<SketchpadDraftVersion[]> {
  const db = getDb();
  if (db) {
    try {
      await db.versions.put(version);
      const allForDraft = sortVersionsDesc(
        await db.versions.where('draftId').equals(version.draftId).toArray()
      );
      if (allForDraft.length > maxPerDraft) {
        const toDelete = allForDraft.slice(maxPerDraft).map((v) => v.id);
        await db.versions.bulkDelete(toDelete);
      }
    } catch {
      // Fallback continues below
    }
  }

  const allCached = readFallbackVersions().filter((v) => v.id !== version.id);
  const forDraft = sortVersionsDesc([
    version,
    ...allCached.filter((v) => v.draftId === version.draftId),
  ]).slice(0, maxPerDraft);
  const others = allCached.filter((v) => v.draftId !== version.draftId);
  writeFallbackVersions([...forDraft, ...others]);

  return loadDraftVersions(version.draftId);
}

export async function deleteDraftVersionById(
  versionId: string,
  draftId: string
): Promise<SketchpadDraftVersion[]> {
  const db = getDb();
  if (db) {
    try {
      await db.versions.delete(versionId);
    } catch {
      // Fallback continues below
    }
  }
  const allCached = readFallbackVersions();
  writeFallbackVersions(allCached.filter((v) => v.id !== versionId));
  return loadDraftVersions(draftId);
}

