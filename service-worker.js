// Simple service worker for SARMS PWA
const CACHE_NAME = 'sarms-cache-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  // CDN assets cannot be precached directly due to cross-origin policies; but runtime caching will handle them.
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))).then(() => self.clients.claim())
  );
});

// Runtime caching: cache-first for cross-origin (CDN) and same-origin
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) {
    // CDN runtime cache: cache-first, then update cache in background
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const fetched = fetch(event.request)
          .then((res) => {
            const resClone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
            return res;
          })
          .catch(() => undefined);
        return cached || fetched;
      })
    );
    return;
  }

  // Same-origin: cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
