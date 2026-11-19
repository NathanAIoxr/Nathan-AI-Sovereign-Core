const version = "alphabet-field-app-2";
const scope = new URL(self.registration.scope);
const cacheName = version + ":" + scope.pathname;
const nestedGateway = scope.pathname.startsWith("/tabor-apps/");
const common = new URL(nestedGateway ? "./common/" : "../common/", scope);
const local = path => new URL(path, scope).href;
const files = [
  local("./"), local("index.html"), local("main.mjs"), local("manifest.webmanifest"),
  local("icon-192.png"), local("icon-512.png"),
  ...["style.css", "tools.mjs", "corpus.mjs", "expansion.mjs"].map(name => new URL(name, common).href),
];
const allowed = new Set(files);

self.addEventListener("install", event => {
  event.waitUntil(caches.open(cacheName).then(cache => cache.addAll(files)));
});
self.addEventListener("activate", event => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(keys.filter(key =>
      key.startsWith("alphabet-field-app-") && key.endsWith(":" + scope.pathname) && key !== cacheName
    ).map(key => caches.delete(key)))),
    self.clients.claim(),
  ]));
});
self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET" || !allowed.has(request.url)) return;
  event.respondWith(caches.open(cacheName).then(async cache => {
    try {
      const response = await fetch(request);
      if (response.ok) await cache.put(request, response.clone());
      return response;
    } catch (error) {
      return (await cache.match(request)) ?? Response.error();
    }
  }));
});
