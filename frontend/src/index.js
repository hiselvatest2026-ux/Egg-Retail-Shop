import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';  // <--- this line must match the file path
import App from './App';

// Optional: Force-clear site storage and caches via URL flag ?clear=1
try {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    if (params.get('clear') === '1') {
      try { window.localStorage.clear(); } catch(_) {}
      try { window.sessionStorage.clear(); } catch(_) {}
      if ('caches' in window) {
        window.caches.keys().then(keys => Promise.all(keys.map(k => window.caches.delete(k)))).finally(() => {
          const bust = Date.now();
          const url = `${window.location.origin}${window.location.pathname}?b=${bust}`;
          window.location.replace(url);
        });
      } else {
        const bust = Date.now();
        const url = `${window.location.origin}${window.location.pathname}?b=${bust}`;
        window.location.replace(url);
      }
    }
  }
} catch(_) {}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
