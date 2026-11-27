import {createRoot} from 'react-dom/client';
import {registerSW} from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';
import {
  notifySwNeedRefresh,
  registerSwUpdateHandler,
  stripCacheBustParamFromWindow,
} from './utils/appUpdater.ts';
import {canAttemptChunkReload} from './utils/lazyWithRetry.ts';

if (typeof window !== 'undefined') {
  stripCacheBustParamFromWindow();

  if (import.meta.env.DEV && 'serviceWorker' in navigator) {
    navigator.serviceWorker
      .getRegistrations()
      .then((regs) => {
        for (const reg of regs) {
          void reg.unregister();
        }
      })
      .catch(() => {});
  } else if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        notifySwNeedRefresh();
      },
      onRegisteredSW(_swUrl, registration) {
        if (!registration) return;
        window.setInterval(() => {
          if (typeof navigator !== 'undefined' && navigator.onLine) {
            void registration.update().catch(() => {});
          }
        }, 3 * 60 * 1000);
      },
    });
    registerSwUpdateHandler(updateSW);
  }

  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    if (canAttemptChunkReload(window.sessionStorage)) {
      window.location.reload();
    }
  });
}

createRoot(document.getElementById('root')!).render(<App />);
