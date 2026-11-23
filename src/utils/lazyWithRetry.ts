import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

const RELOAD_STORAGE_KEY = 'tl-chunk-reload-ts';
const RELOAD_COOLDOWN_MS = 15_000;

export function isDynamicImportError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = `${error.name} ${error.message}`.toLowerCase();
  return (
    msg.includes('failed to fetch dynamically imported module') ||
    msg.includes('importing a module script failed') ||
    msg.includes('error loading dynamically imported module') ||
    msg.includes('chunkloaderror') ||
    msg.includes('loading chunk')
  );
}

export async function retryDynamicImport<T>(
  loader: () => Promise<T>,
  retries = 2,
  delayMs = 220
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await loader();
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

export function canAttemptChunkReload(
  storage: Pick<Storage, 'getItem' | 'setItem'> | null | undefined,
  now = Date.now()
): boolean {
  if (!storage) return false;
  try {
    const raw = storage.getItem(RELOAD_STORAGE_KEY);
    const prev = raw ? Number(raw) : 0;
    if (Number.isFinite(prev) && now - prev < RELOAD_COOLDOWN_MS) {
      return false;
    }
    storage.setItem(RELOAD_STORAGE_KEY, String(now));
    return true;
  } catch {
    return false;
  }
}

export function lazyWithRetry<T extends ComponentType<any>>(
  loader: () => Promise<{ default: T }>,
  retries = 2
): LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      return await retryDynamicImport(loader, retries);
    } catch (error) {
      if (
        typeof window !== 'undefined' &&
        isDynamicImportError(error) &&
        canAttemptChunkReload(window.sessionStorage)
      ) {
        window.location.reload();
        // Keep promise pending briefly while browser navigates/reloads cleanly
        await new Promise<never>(() => {});
      }
      throw error;
    }
  });
}
