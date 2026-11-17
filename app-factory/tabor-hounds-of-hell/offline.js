const cacheName='tabor-hounds-app-v2';
const cachePrefix='tabor-hounds-app-';
const shell=['./','./index.html','./style.css','./campaign.mjs','./series.mjs','./app.mjs','./app.webmanifest','./icon-192.png','./icon-512.png','./track-baller.html','./correction.html'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(cacheName).then(cache=>cache.addAll(shell)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(cachePrefix)&&key!==cacheName).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const {request}=event;
  if (request.method!=='GET'||new URL(request.url).origin!==location.origin) return;
  event.respondWith(fetch(request).catch(async()=>{
    const cache=await caches.open(cacheName);
    return await cache.match(request)??new Response('This page is unavailable offline.',{status:503});
  }));
});
