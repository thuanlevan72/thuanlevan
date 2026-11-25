import Dexie, { type Table } from 'dexie';
import {
  createInitialCloudValleyState,
  parseSaveState,
  type CloudValleyGameState,
} from './cloudValleyEngine.ts';

interface SaveSlotRecord {
  id: string;
  updatedAt: number;
  state: CloudValleyGameState;
}

class CloudValleyDatabase extends Dexie {
  saves!: Table<SaveSlotRecord, string>;

  constructor() {
    super('CloudValleyHomesteadDB');
    this.version(1).stores({
      saves: 'id, updatedAt',
    });
  }
}

const SAVE_ROW_ID = 'primary_homestead_v1';
const FALLBACK_LS_KEY = 'cloud-valley-homestead-v1';

let dbInstance: CloudValleyDatabase | null = null;

function getDb(): CloudValleyDatabase | null {
  if (typeof window === 'undefined' || typeof indexedDB === 'undefined') return null;
  if (!dbInstance) {
    dbInstance = new CloudValleyDatabase();
  }
  return dbInstance;
}

export async function saveCloudValleyState(state: CloudValleyGameState): Promise<void> {
  const stamped: CloudValleyGameState = {
    ...state,
    lastActiveTimestamp: Date.now(),
  };
  const db = getDb();
  if (db) {
    try {
      await db.saves.put({
        id: SAVE_ROW_ID,
        updatedAt: stamped.lastActiveTimestamp,
        state: stamped,
      });
    } catch {
      // Fallback below
    }
  }
  try {
    localStorage.setItem(FALLBACK_LS_KEY, JSON.stringify(stamped));
  } catch {
    // Ignore storage quota errors
  }
}

export async function loadCloudValleyState(): Promise<{
  state: CloudValleyGameState;
  hasExistingSave: boolean;
}> {
  const db = getDb();
  if (db) {
    try {
      const record = await db.saves.get(SAVE_ROW_ID);
      if (record?.state) {
        const validated = parseSaveState(JSON.stringify(record.state));
        if (validated) {
          return { state: validated, hasExistingSave: true };
        }
      }
    } catch {
      // Try localStorage fallback
    }
  }

  try {
    const raw = localStorage.getItem(FALLBACK_LS_KEY);
    if (raw) {
      const validated = parseSaveState(raw);
      if (validated) {
        return { state: validated, hasExistingSave: true };
      }
    }
  } catch {
    // Ignore
  }

  return { state: createInitialCloudValleyState(Date.now()), hasExistingSave: false };
}

export async function clearCloudValleySave(): Promise<void> {
  const db = getDb();
  if (db) {
    try {
      await db.saves.delete(SAVE_ROW_ID);
    } catch {
      // Ignore
    }
  }
  try {
    localStorage.removeItem(FALLBACK_LS_KEY);
  } catch {
    // Ignore
  }
}
