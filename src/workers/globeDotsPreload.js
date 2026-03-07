// ── globeDotsPreload.js ───────────────────────────────────────────────────────
// Sole purpose: start the worker and world-atlas fetch as early as possible.
//
// This module is imported synchronously by HeroSection/index.jsx, which itself
// is a sync import of the main bundle. So this evaluates at page-load time —
// long before lazy(() => import('../GlobeCanvas')) even fires.
//
// GlobeCanvas.jsx imports the same path, hitting the JS module cache and
// receiving the exact same promise instance — no second worker, no second fetch.
//
// Timeline achieved:
//   page load → HeroSection parses → THIS FILE evaluates → worker starts → fetch begins
//                                   ↓ in parallel ↓
//                              lazy() fetches GlobeCanvas chunk
//                                   ↓ when chunk arrives ↓
//                              useEffect .then(dotsPromise) — often already resolved

import GlobeDotsWorker from './globeDots.worker.js?worker';

const DOT_COUNT = 20000;

export const dotsPromise = new Promise((resolve, reject) => {
  const worker = new GlobeDotsWorker();
  worker.postMessage({ dotCount: DOT_COUNT });
  worker.onmessage = ({ data }) => {
    worker.terminate();
    if (data.error) reject(new Error(data.error));
    else resolve(data); // { positions: Float32Array, colors: Float32Array }
  };
  worker.onerror = (e) => { worker.terminate(); reject(e); };
});
