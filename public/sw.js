// Minimal service worker: shows a friendly offline page when the phone has no
// signal. Pages and data are always fetched fresh from the network; only the
// offline page and its logo are cached.
const CACHE = 'barakah-offline-v1';
const OFFLINE_URL = '/offline.html';
const PRECACHE = [OFFLINE_URL, '/logo-wide-transparent.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }
  // The offline page's own logo
  if (PRECACHE.includes(new URL(request.url).pathname)) {
    event.respondWith(fetch(request).catch(() => caches.match(request, { ignoreSearch: true })));
  }
});
