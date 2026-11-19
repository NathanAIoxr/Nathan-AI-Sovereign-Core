const cacheName = 'shit-tihs-v1';
const shell = ['./', './style.css', './app.mjs', './game.mjs', './draw.mjs', './app.webmanifest', './icon-192.png', './icon-512.png'];

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
    event.respondWith(fetch(request).catch(() => caches.match(new URL('./', self.registration.scope))));
  } else {
    event.respondWith(caches.match(request).then(hit => hit || fetch(request)));
  }
});
