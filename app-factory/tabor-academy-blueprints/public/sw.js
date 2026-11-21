import { flushOutbox, pendingObservations } from "./sync.js";

const cacheName = "tabor-academy-field-v7";
const shell = ["/", "/app.js", "/explorers.js", "/phase2.css", "/sync.js", "/field.js",
  "/academy.webmanifest", "/exports/blueprints.json", "/exports/blueprints.csv",
  "/exports/blueprints-integrity.json", "/exports/blueprints-v7.json",
  "/curriculum/", "/curriculum/catalog.css", "/curriculum/catalog.js", "/exports/academy-curriculum.json"];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(cacheName).then(cache => cache.addAll(shell)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(names => Promise.all(names
    .filter(name => name.startsWith("tabor-academy-field-") && name !== cacheName)
    .map(name => caches.delete(name)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  let cacheKey;
  if (request.mode === "navigate" && url.pathname === "/") cacheKey = "/";
  else if (shell.includes(url.pathname)) cacheKey = url.pathname;
  else return;
  event.respondWith((async () => {
    const cache = await caches.open(cacheName);
    try {
      const response = await fetch(request);
      if (response.ok) await cache.put(cacheKey, response.clone());
      return response;
    } catch {
      return (await cache.match(cacheKey)) ?? new Response("Offline resource unavailable", { status: 503 });
    }
  })());
});

self.addEventListener("sync", event => {
  if (event.tag !== "academy-outbox") return;
  event.waitUntil((async () => {
    await flushOutbox();
    const clients = await self.clients.matchAll({ type: "window" });
    for (const client of clients) client.postMessage({ type: "academy-outbox" });
    if ((await pendingObservations()).some(entry => !entry.error)) throw new Error("Pending field observations");
  })());
});
