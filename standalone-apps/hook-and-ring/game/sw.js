const VERSION = 'hook-ring-cloudflare-__OFFLINE_REVISION__';
const SHELL = ['/ecosystem', '/ecosystem.css', '/ecosystem.mjs', '/ecosystem.json', '/controllers/digit-input.mjs', '/training', '/training.css', '/training.mjs?v=2', '/shot-record.mjs?v=2', '/shot-record.mjs', '/controllers/engine.mjs', '/controllers/kinetic.mjs', '/controllers/track-baller.mjs', '/', '/chassis', '/chassis.css?v=11', '/chassis.mjs?v=11', '/chassis-ui.mjs?v=11', '/universal-bridge.mjs', '/game-plugins.json', '/GamePluginConfig.cs', '/grapple.mjs', '/grapple-it', '/arcade', '/arcade.css', '/arcade.mjs', '/precision.mjs', '/yard-darts', '/yard-darts.js?v=8', '/yard-rules.mjs', '/yard-economy.mjs', '/grapple.css', '/grapple.css?v=9', '/arcade-progress.mjs?v=9', '/arcade.mjs?v=9', '/grapple-ui.mjs?v=9', '/grapple.mjs?v=9', '/style.css?v=7', '/app.mjs?v=10', '/physics.mjs', '/input.mjs?v=3', '/render.mjs?v=4', '/rewards.mjs', '/throw-breaks.mjs', '/opponent.mjs', '/icon.svg', '/icon-192.png', '/icon-512.png', '/manifest.webmanifest', '/competition', '/competition.css', '/competition-ui.mjs?v=4', '/event-results.mjs'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(SHELL.map(path =>
    new Request(new URL(path, self.location.origin), { cache: 'reload' })
  ))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('hook-ring-')&&key!==VERSION).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
const offlinePaths = new Set(SHELL.map(path => new URL(path, self.location.origin).pathname));
self.addEventListener('fetch', event => {
  const { request } = event;
  const { origin, pathname } = new URL(request.url);
  const navigation = request.mode === 'navigate';
  if (origin !== self.location.origin || request.method !== 'GET' ||
      pathname.startsWith('/api/') || pathname === '/release.json' || pathname === '/source.tar.gz' ||
      (!navigation && !offlinePaths.has(pathname))) return;

  event.respondWith((async () => {
    let response;
    try {
      response = await fetch(request);
      if (response.status < 500) return response;
    } catch {
      response = Response.error();
    }
    const cache = await caches.open(VERSION);
    const saved = await cache.match(request, { ignoreSearch: true });
    if (saved) return saved;
    return navigation && !offlinePaths.has(pathname) ? (await cache.match('/')) ?? response : response;
  })());
});
