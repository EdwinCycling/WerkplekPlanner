
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker for PWA only in production; actively unregister during development to avoid caching issues
if ('serviceWorker' in navigator) {
  if (import.meta.env.MODE === 'production') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // no-op: registration failed, keep app functional
      });
    });
  } else {
    // Dev mode: ensure no stale service worker interferes with dev preview
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((reg) => reg.unregister());
    }).catch(() => {
      // no-op: unregister failed, ignore
    });
  }
}
