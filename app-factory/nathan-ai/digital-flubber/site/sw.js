const cacheKey = 'digital-flubber-{{version}}';
const paths = ['/', '/game', '/learn', '/zones', '/sos', '/app.mjs', '/policy.mjs', '/physics.mjs', '/style.css', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png'];
self.addEventListener('install', event => event.waitUntil(caches.open(cacheKey).then(cache => cache.addAll(paths))));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys =>
  Promise.all(keys.filter(key => key.startsWith('digital-flubber-') && key !== cacheKey).map(key => caches.delete(key)))
)));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || !paths.includes(url.pathname)) return;
  event.respondWith(fetch(event.request).catch(async () =>
    (await caches.open(cacheKey)).match(url.pathname)
      .then(response => response ?? new Response('Unavailable offline', { status: 503 }))
  ));
});
