import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppBuildVersionInfo,
  fetchLatestBuildVersion,
  getEmbeddedBuildInfo,
  isBuildUpdateAvailable,
  isSwNeedRefreshPending,
  performHardWebUpdate,
  subscribeSwNeedRefresh,
  triggerServiceWorkerUpdateCheck,
} from '../utils/appUpdater.ts';

export type WebUpdateCheckStatus =
  | 'idle'
  | 'checking'
  | 'up-to-date'
  | 'update-available'
  | 'updating'
  | 'error';

const AUTO_CHECK_INTERVAL_MS = 3 * 60 * 1000;
const CHECK_THROTTLE_MS = 15 * 1000;

export function useAppUpdater() {
  const [currentBuild] = useState<AppBuildVersionInfo>(() => getEmbeddedBuildInfo());
  const [remoteBuild, setRemoteBuild] = useState<AppBuildVersionInfo | null>(null);
  const [swPending, setSwPending] = useState<boolean>(() => isSwNeedRefreshPending());
  const [status, setStatus] = useState<WebUpdateCheckStatus>('idle');
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);

  const lastCheckTsRef = useRef(0);
  const isCheckingRef = useRef(false);

  const buildDiffAvailable = isBuildUpdateAvailable(currentBuild.buildId, remoteBuild);
  const updateAvailable = buildDiffAvailable || swPending;

  const checkForUpdates = useCallback(
    async (manual = false): Promise<boolean> => {
      const now = Date.now();
      if (!manual && now - lastCheckTsRef.current < CHECK_THROTTLE_MS) {
        return updateAvailable;
      }
      if (isCheckingRef.current) {
        return updateAvailable;
      }

      isCheckingRef.current = true;
      lastCheckTsRef.current = now;
      setStatus('checking');
      setErrorMessage(null);

      try {
        const [latest, hasWaitingSw] = await Promise.all([
          fetchLatestBuildVersion(fetch, now),
          triggerServiceWorkerUpdateCheck(),
        ]);

        setLastCheckedAt(new Date(now).toISOString());
        if (latest) {
          setRemoteBuild(latest);
        }
        if (hasWaitingSw) {
          setSwPending(true);
        }

        const hasNewBuild = isBuildUpdateAvailable(currentBuild.buildId, latest) || hasWaitingSw;
        if (hasNewBuild) {
          setIsBannerDismissed(false);
          setStatus('update-available');
          return true;
        }

        if (!latest && manual) {
          setStatus('error');
          setErrorMessage('Không thể kiểm tra máy chủ lúc này. Bạn vẫn có thể làm mới cache trực tiếp.');
          return false;
        }

        setStatus('up-to-date');
        return false;
      } catch {
        setStatus('error');
        if (manual) {
          setErrorMessage('Lỗi kết nối khi kiểm tra phiên bản mới.');
        }
        return false;
      } finally {
        isCheckingRef.current = false;
      }
    },
    [currentBuild.buildId, updateAvailable]
  );

  const applyWebUpdate = useCallback(async () => {
    setStatus('updating');
    await performHardWebUpdate();
  }, []);

  const dismissBanner = useCallback(() => {
    setIsBannerDismissed(true);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeSwNeedRefresh(() => {
      setSwPending(true);
      setIsBannerDismissed(false);
      setStatus('update-available');
    });

    const bootTimer = window.setTimeout(() => {
      void checkForUpdates(false);
    }, 1200);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void checkForUpdates(false);
      }
    };

    const handleFocus = () => {
      void checkForUpdates(false);
    };

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void checkForUpdates(false);
      }
    }, AUTO_CHECK_INTERVAL_MS);

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);

    return () => {
      unsubscribe();
      window.clearTimeout(bootTimer);
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
    };
  }, [checkForUpdates]);

  return {
    currentBuild,
    remoteBuild,
    swPending,
    updateAvailable,
    status,
    lastCheckedAt,
    errorMessage,
    isBannerDismissed,
    checkForUpdates,
    applyWebUpdate,
    dismissBanner,
  };
}
