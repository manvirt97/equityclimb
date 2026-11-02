/* The Crave House Desserts PWA service worker — staging, no personal data. */
const CACHE_VERSION = 'crave-house-v3';
const CONTENT_CACHE = CACHE_VERSION + '-content';
const RUNTIME_CACHE = CACHE_VERSION + '-runtime';
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/offline.html', '/icon-192.png', '/icon-512.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CONTENT_CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) {
      if (name.startsWith('crave-house-') && name !== CONTENT_CACHE && name !== RUNTIME_CACHE) {
        await caches.delete(name);
      }
    }
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (!['http:', 'https:'].includes(url.protocol)) return;
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok) (await caches.open(CONTENT_CACHE)).put('/', response.clone());
        return response;
      } catch {
        return (await caches.match('/')) || (await caches.match('/offline.html')) || Response.error();
      }
    })());
    return;
  }
  const sameOrigin = url.origin === self.location.origin;
  const isImage = url.hostname === 'crave-house-desserts-preview.lovable.app' && url.pathname.startsWith('/assets/');
  const isFont = ['fonts.googleapis.com','fonts.gstatic.com'].includes(url.hostname);
  if (!sameOrigin && !isImage && !isFont) return;
  event.respondWith((async () => {
    const cache = await caches.open(sameOrigin ? CONTENT_CACHE : RUNTIME_CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;
    try {
      const result = await fetch(request);
      if (result.ok || result.type === 'opaque') {
        await cache.put(request, result.clone()).catch(() => {});
      }
      return result;
    } catch { return cached || Response.error(); }
  })());
});
