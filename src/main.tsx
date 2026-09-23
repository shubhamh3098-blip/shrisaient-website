// Global safety filter for known Firestore quota and backend backoff logs
if (typeof window !== 'undefined') {
  const origConsoleError = console.error;
  console.error = function (...args: any[]) {
    try {
      const msg = args.map((a) => {
        if (!a) return '';
        if (typeof a === 'string') return a;
        if (a instanceof Error) return `${a.name} ${a.message} ${a.stack || ''}`;
        try {
          return JSON.stringify(a);
        } catch {
          return String(a);
        }
      }).join(' ');

      if (
        msg.includes('resource-exhausted') ||
        msg.includes('Quota limit exceeded') ||
        msg.includes('Free daily write units') ||
        msg.includes('Using maximum backoff delay') ||
        msg.includes('overloading the backend')
      ) {
        return; // Suppress from console
      }
    } catch {}
    origConsoleError.apply(console, args);
  };

  const origConsoleWarn = console.warn;
  console.warn = function (...args: any[]) {
    try {
      const msg = args.map((a) => {
        if (!a) return '';
        if (typeof a === 'string') return a;
        if (a instanceof Error) return `${a.name} ${a.message}`;
        try {
          return JSON.stringify(a);
        } catch {
          return String(a);
        }
      }).join(' ');

      if (
        msg.includes('resource-exhausted') ||
        msg.includes('Quota limit exceeded') ||
        msg.includes('Free daily write units') ||
        msg.includes('Using maximum backoff delay') ||
        msg.includes('overloading the backend')
      ) {
        return; // Suppress from console
      }
    } catch {}
    origConsoleWarn.apply(console, args);
  };
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './context/ThemeContext';
import { registerSW } from 'virtual:pwa-register';

// Auto-register and update PWA service worker for offline support
if ('serviceWorker' in navigator) {
  registerSW({
    immediate: true,
    onNeedRefresh() {
      console.log('New content available, refreshing...');
    },
    onOfflineReady() {
      console.log('App ready to work offline');
    },
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
);

