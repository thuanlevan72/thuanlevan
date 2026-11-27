export interface AppBuildVersionInfo {
  buildId: string;
  builtAt: string;
  mode?: 'production' | 'development';
}

export const CACHE_BUST_PARAM = '_sw_refresh';

type SwUpdateHandler = (reloadPage?: boolean) => Promise<void>;

let swWaitingApplyHandler: SwUpdateHandler | null = null;
const swNeedRefreshListeners = new Set<() => void>();
let swNeedRefreshFlag = false;

export function registerSwUpdateHandler(handler: SwUpdateHandler): void {
  swWaitingApplyHandler = handler;
}

export function notifySwNeedRefresh(): void {
  swNeedRefreshFlag = true;
  for (const listener of swNeedRefreshListeners) {
    listener();
  }
}

export function isSwNeedRefreshPending(): boolean {
  return swNeedRefreshFlag;
}

export function subscribeSwNeedRefresh(listener: () => void): () => void {
  swNeedRefreshListeners.add(listener);
  return () => {
    swNeedRefreshListeners.delete(listener);
  };
}

export function getEmbeddedBuildInfo(): AppBuildVersionInfo {
  const buildId =
    typeof __APP_BUILD_ID__ === 'string' && __APP_BUILD_ID__.trim().length > 0
      ? __APP_BUILD_ID__.trim()
      : 'local-build';
  const builtAt =
    typeof __APP_BUILD_TIME__ === 'string' && __APP_BUILD_TIME__.trim().length > 0
      ? __APP_BUILD_TIME__.trim()
      : new Date().toISOString();
  return {
    buildId,
    builtAt,
  };
}

export function parseVersionPayload(raw: unknown): AppBuildVersionInfo | null {
  if (!raw || typeof raw !== 'object') return null;
  const candidate = raw as Partial<AppBuildVersionInfo>;
  if (typeof candidate.buildId !== 'string') return null;
  const buildId = candidate.buildId.trim();
  if (!buildId) return null;
  const builtAt =
    typeof candidate.builtAt === 'string' && candidate.builtAt.trim().length > 0
      ? candidate.builtAt.trim()
      : '';
  const mode =
    candidate.mode === 'production' || candidate.mode === 'development'
      ? candidate.mode
      : undefined;
  return { buildId, builtAt, mode };
}

export function isBuildUpdateAvailable(
  currentBuildId: string,
  remoteInfo: AppBuildVersionInfo | null
): boolean {
  if (!remoteInfo) return false;
  const localId = currentBuildId.trim();
  const remoteId = remoteInfo.buildId.trim();
  if (!localId || !remoteId || localId === 'local-build') return false;
  return localId !== remoteId;
}

export function buildCacheBustReloadUrl(
  href: string,
  token: string | number = Date.now()
): string {
  try {
    const parsed = new URL(href);
    parsed.searchParams.set(CACHE_BUST_PARAM, String(token));
    return parsed.toString();
  } catch {
    const hashIdx = href.indexOf('#');
    const base = hashIdx >= 0 ? href.slice(0, hashIdx) : href;
    const hash = hashIdx >= 0 ? href.slice(hashIdx) : '';
    const sep = base.includes('?') ? '&' : '?';
    return `${base}${sep}${CACHE_BUST_PARAM}=${encodeURIComponent(String(token))}${hash}`;
  }
}

export function stripCacheBustParam(href: string): string | null {
  try {
    const parsed = new URL(href);
    if (!parsed.searchParams.has(CACHE_BUST_PARAM)) {
      return null;
    }
    parsed.searchParams.delete(CACHE_BUST_PARAM);
    return parsed.toString();
  } catch {
    return null;
  }
}

export function stripCacheBustParamFromWindow(): void {
  if (typeof window === 'undefined') return;
  const cleanUrl = stripCacheBustParam(window.location.href);
  if (cleanUrl && window.history?.replaceState) {
    try {
      window.history.replaceState(window.history.state, '', cleanUrl);
    } catch {
      // Ignore history replace errors
    }
  }
}

export function formatShortBuildId(buildId: string): string {
  const clean = buildId.trim();
  if (!clean) return '—';
  if (clean.length <= 16) return clean;
  return `${clean.slice(0, 8)}…${clean.slice(-6)}`;
}

export function formatBuildTimestamp(iso: string): string {
  if (!iso) return 'Không rõ thời gian';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  } catch {
    return d.toISOString();
  }
}

export async function fetchLatestBuildVersion(
  fetcher: typeof fetch = fetch,
  now: number = Date.now()
): Promise<AppBuildVersionInfo | null> {
  const endpoints = [`/api/version?t=${now}`, `/version.json?t=${now}`];
  for (const url of endpoints) {
    try {
      const response = await fetcher(url, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
      });
      if (!response.ok) continue;
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json') && !url.includes('.json')) continue;
      const json = (await response.json()) as unknown;
      const parsed = parseVersionPayload(json);
      if (parsed) return parsed;
    } catch {
      // Try fallback endpoint
    }
  }
  return null;
}

export async function triggerServiceWorkerUpdateCheck(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    let hasWaiting = false;
    await Promise.all(
      registrations.map(async (reg) => {
        if (reg.waiting) {
          hasWaiting = true;
        }
        try {
          await reg.update();
          if (reg.waiting) {
            hasWaiting = true;
          }
        } catch {
          // Ignore individual SW update errors (e.g. offline)
        }
      })
    );
    if (hasWaiting) {
      notifySwNeedRefresh();
    }
    return hasWaiting;
  } catch {
    return false;
  }
}

export interface HardUpdateDeps {
  currentHref?: string;
  now?: number;
  applyWaitingSw?: (() => Promise<void>) | null;
  serviceWorkerContainer?: {
    getRegistrations: () => Promise<
      ReadonlyArray<{
        waiting?: { postMessage: (msg: unknown) => void } | null;
        unregister: () => Promise<boolean>;
      }>
    >;
  };
  cacheStorage?: {
    keys: () => Promise<string[]>;
    delete: (key: string) => Promise<boolean>;
  };
  reloadWithUrl?: (url: string) => void;
}

export async function performHardWebUpdate(deps: HardUpdateDeps = {}): Promise<string> {
  const now = deps.now ?? Date.now();
  const currentHref =
    deps.currentHref ?? (typeof window !== 'undefined' ? window.location.href : 'http://localhost/');
  const applyWaiting = deps.applyWaitingSw ?? swWaitingApplyHandler;
  const swContainer =
    deps.serviceWorkerContainer ??
    (typeof navigator !== 'undefined' && 'serviceWorker' in navigator
      ? navigator.serviceWorker
      : undefined);
  const cacheStorage =
    deps.cacheStorage ?? (typeof window !== 'undefined' && 'caches' in window ? window.caches : undefined);

  // 1. Ask waiting Service Worker to skip waiting if registered
  if (applyWaiting) {
    try {
      await applyWaiting(false);
    } catch {
      // Continue clearing caches regardless
    }
  }

  // 2. Unregister active/stale Service Workers so the next load fetches fresh HTML + assets
  if (swContainer) {
    try {
      const registrations = await swContainer.getRegistrations();
      await Promise.all(
        registrations.map(async (reg) => {
          try {
            reg.waiting?.postMessage({ type: 'SKIP_WAITING' });
          } catch {
            // Ignore postMessage failure
          }
          try {
            await reg.unregister();
          } catch {
            // Ignore unregister failure
          }
        })
      );
    } catch {
      // Ignore SW enumeration failure
    }
  }

  // 3. Purge all Workbox / runtime Cache Storage buckets
  if (cacheStorage) {
    try {
      const keys = await cacheStorage.keys();
      await Promise.all(
        keys.map(async (key) => {
          try {
            await cacheStorage.delete(key);
          } catch {
            // Ignore cache delete failure
          }
        })
      );
    } catch {
      // Ignore Cache Storage failure
    }
  }

  // 4. Perform cache-busted navigation reload to bypass browser HTTP cache
  const nextUrl = buildCacheBustReloadUrl(currentHref, now);
  if (deps.reloadWithUrl) {
    deps.reloadWithUrl(nextUrl);
  } else if (typeof window !== 'undefined') {
    window.location.replace(nextUrl);
  }

  return nextUrl;
}
