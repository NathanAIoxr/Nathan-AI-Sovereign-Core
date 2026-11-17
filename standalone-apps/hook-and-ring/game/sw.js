const VERSION = 'hook-ring-cloudflare-v3';
const SHELL = ['/training', '/training.css', '/training.mjs', '/shot-record.mjs', '/controllers/engine.mjs', '/controllers/kinetic.mjs', '/controllers/track-baller.mjs', '/', '/chassis', '/chassis.css?v=11', '/chassis.mjs?v=11', '/chassis-ui.mjs?v=11', '/universal-bridge.mjs', '/game-plugins.json', '/GamePluginConfig.cs', '/grapple.mjs', '/grapple-it', '/arcade', '/arcade.css', '/arcade.mjs', '/precision.mjs', '/yard-darts', '/yard-darts.js?v=8', '/yard-rules.mjs', '/yard-economy.mjs', '/grapple.css', '/grapple.css?v=9', '/arcade-progress.mjs?v=9', '/arcade.mjs?v=9', '/grapple-ui.mjs?v=9', '/grapple.mjs?v=9', '/style.css?v=7', '/app.mjs?v=10', '/physics.mjs', '/input.mjs?v=3', '/render.mjs?v=4', '/rewards.mjs', '/throw-breaks.mjs', '/opponent.mjs', '/icon.svg', '/icon-192.png', '/icon-512.png', '/manifest.webmanifest', '/competition', '/competition.css', '/competition-ui.mjs?v=3', '/event-results.mjs'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('hook-ring-')&&key!==VERSION).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || event.request.method !== 'GET' || url.pathname.startsWith('/api/')) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(()=>caches.match(url.pathname).then(page=>page||caches.match('/'))));
  } else if (SHELL.includes(url.pathname+url.search)){
    event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request)));
  }
});
