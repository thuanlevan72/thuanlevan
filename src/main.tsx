import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {canAttemptChunkReload} from './utils/lazyWithRetry.ts';

if (typeof window !== 'undefined') {
  if (import.meta.env.DEV && 'serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      for (const reg of regs) {
        void reg.unregister();
      }
    }).catch(() => {});
  }
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    if (canAttemptChunkReload(window.sessionStorage)) {
      window.location.reload();
    }
  });
}

createRoot(document.getElementById('root')!).render(<App />);
