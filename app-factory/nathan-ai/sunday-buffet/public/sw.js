const CACHE = "tabor-sunday-buffet-v1";
const ASSETS = ["", "app", "game", "book", "book.pdf", "style.css", "app.mjs",
  "engine.mjs", "manifest.webmanifest", "icon-192.png", "icon-512.png"]
  .map((path) => new URL(path, self.registration.scope).pathname);

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((names) =>
    Promise.all(names.filter((name) => name.startsWith("tabor-sunday-buffet-") && name !== CACHE)
      .map((name) => caches.delete(name)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || !ASSETS.includes(url.pathname)) return;
  event.respondWith(fetch(request).catch(async () =>
    (await caches.match(url.pathname)) ?? Response.error()));
});
