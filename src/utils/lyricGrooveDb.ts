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

const PIANO_SEED_KEY = 'lyric-groove-grand-piano-seed-v2';
const AM_BALLAD_SEED_KEY = 'lyric-groove-am-ballad-seed-v5';
const THANG_TU_SEED_KEY = 'lyric-groove-thang-tu-seed-v3';

function normalizeDraftDefaults(draft: SketchpadDraft): SketchpadDraft {
  return {
    ...draft,
    backingPattern:
      draft.backingPattern ??
      (draft.backingInstrument === 'piano-ballad' ? 'auto-song' : 'rich-block'),
    sustainPedal: draft.sustainPedal ?? true,
    metronomeEnabled: draft.metronomeEnabled ?? false,
  };
}

function ensureStarterSeedsOnce(existing: SketchpadDraft[]): {
  drafts: SketchpadDraft[];
  newlyAdded: SketchpadDraft[];
} {
  let result = existing.map(normalizeDraftDefaults);
  const newlyAdded: SketchpadDraft[] = [];
  const starters = createStarterDrafts();

  try {
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

    const amSeeded = localStorage.getItem(AM_BALLAD_SEED_KEY);
    const amStarter = starters.find((d) => d.id === 'draft-khoang-cach-hai-ta-am');
    if (!amSeeded && amStarter) {
      localStorage.setItem(AM_BALLAD_SEED_KEY, '1');
      const idx = result.findIndex((d) => d.id === amStarter.id);
      if (idx < 0) {
        result = [amStarter, ...result];
        newlyAdded.push(amStarter);
      } else {
        const upgraded: SketchpadDraft = {
          ...result[idx],
          title: amStarter.title,
          mood: amStarter.mood,
          bpm: amStarter.bpm,
          drumPattern: amStarter.drumPattern,
          backingInstrument: amStarter.backingInstrument,
          backingPattern: amStarter.backingPattern,
          chordArpStyles: amStarter.chordArpStyles,
          sections: amStarter.sections,
          melodyNotes: amStarter.melodyNotes,
        };
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
      const idx = result.findIndex((d) => d.id === thangTuStarter.id);
      if (idx < 0) {
        result = [thangTuStarter, ...result];
        newlyAdded.push(thangTuStarter);
      } else {
        const upgraded: SketchpadDraft = {
          ...result[idx],
          title: thangTuStarter.title,
          mood: thangTuStarter.mood,
          bpm: thangTuStarter.bpm,
          drumPattern: thangTuStarter.drumPattern,
          backingInstrument: thangTuStarter.backingInstrument,
          backingPattern: thangTuStarter.backingPattern,
          chordArpStyles: thangTuStarter.chordArpStyles,
          sections: thangTuStarter.sections,
          melodyNotes: thangTuStarter.melodyNotes,
        };
        result[idx] = upgraded;
        newlyAdded.push(upgraded);
      }
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

  return { drafts: result, newlyAdded };
}

export async function loadAllSketchpadDrafts(): Promise<SketchpadDraft[]> {
  const db = getDb();
  if (db) {
    try {
      const existing = await db.drafts.orderBy('updatedAt').reverse().toArray();
      if (existing.length > 0) {
        const { drafts, newlyAdded } = ensureStarterSeedsOnce(existing);
        if (newlyAdded.length > 0) {
          await db.drafts.bulkPut(newlyAdded);
        }
        return drafts;
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
    const { drafts } = ensureStarterSeedsOnce(
      cached.sort((a, b) => b.updatedAt - a.updatedAt)
    );
    writeFallbackDrafts(drafts);
    return drafts;
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
