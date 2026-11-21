import Dexie, { type EntityTable } from 'dexie';
import { createStarterDrafts, type SketchpadDraft } from './lyricGrooveEngine.ts';

const FALLBACK_STORAGE_KEY = 'lyric-groove-sketchpad-drafts-v1';

class LyricGrooveDatabase extends Dexie {
  drafts!: EntityTable<SketchpadDraft, 'id'>;

  constructor() {
    super('LyricGrooveSketchpadDB');
    this.version(1).stores({
      drafts: 'id, updatedAt, title',
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

const PIANO_SEED_KEY = 'lyric-groove-grand-piano-seed-v1';

function normalizeDraftDefaults(draft: SketchpadDraft): SketchpadDraft {
  return {
    ...draft,
    backingPattern:
      draft.backingPattern ??
      (draft.backingInstrument === 'piano-ballad' ? 'ballad-arpeggio' : 'rich-block'),
    sustainPedal: draft.sustainPedal ?? true,
    metronomeEnabled: draft.metronomeEnabled ?? false,
  };
}

function ensureGrandPianoSeedOnce(existing: SketchpadDraft[]): SketchpadDraft[] {
  const normalized = existing.map(normalizeDraftDefaults);
  try {
    const seeded = localStorage.getItem(PIANO_SEED_KEY);
    if (!seeded && !normalized.some((d) => d.id === 'draft-dem-pho-mua-piano')) {
      localStorage.setItem(PIANO_SEED_KEY, '1');
      const [pianoStarter] = createStarterDrafts();
      return [pianoStarter, ...normalized];
    }
    if (!seeded) {
      localStorage.setItem(PIANO_SEED_KEY, '1');
    }
  } catch {
    // Ignore storage access errors
  }
  return normalized;
}

export async function loadAllSketchpadDrafts(): Promise<SketchpadDraft[]> {
  const db = getDb();
  if (db) {
    try {
      const existing = await db.drafts.orderBy('updatedAt').reverse().toArray();
      if (existing.length > 0) {
        const merged = ensureGrandPianoSeedOnce(existing);
        if (merged.length > existing.length) {
          await db.drafts.put(merged[0]);
        }
        return merged;
      }
      const starters = createStarterDrafts();
      await db.drafts.bulkPut(starters);
      writeFallbackDrafts(starters);
      return starters;
    } catch {
      // Fallback to localStorage below
    }
  }

  const cached = readFallbackDrafts();
  if (cached) {
    return ensureGrandPianoSeedOnce(
      cached.sort((a, b) => b.updatedAt - a.updatedAt)
    );
  }
  const starters = createStarterDrafts();
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
    } catch {
      // Fallback continues below
    }
  }
  const current = readFallbackDrafts();
  if (current) {
    writeFallbackDrafts(current.filter((d) => d.id !== id));
  }
}
