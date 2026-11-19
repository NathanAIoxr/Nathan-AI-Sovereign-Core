const cacheName = 'shit-tihs-v4';
const shell = ['./index.html', './style.css?v=2', './app.mjs?v=2', './game.mjs?v=2', './draw.mjs?v=2', './app.webmanifest', './icon-192.png', './icon-512.png',
  './throw-at-sam.html', './throw-at-sam.css', './throw-at-sam.mjs',
  './sam-altman-satire.webp', './shit-tihs-cover.webp', './romans-13-4.webp?v=2'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(cacheName).then(cache => cache.addAll(shell)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(key => key.startsWith('shit-tihs-') && key !== cacheName).map(key => caches.delete(key)))
  ).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || !request.url.startsWith(self.registration.scope)) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(async () => {
      const cached = await caches.match(request, { ignoreSearch: true });
      return cached || caches.match(new URL('./index.html', self.registration.scope));
    }));
  } else {
    event.respondWith(caches.match(request).then(hit => hit || fetch(request)));
  }
});
