/* Scoped offline shell. No analytics, network crawler, or cross-app caching. */
const CACHE='tabor-octopus-arsenal-v1';
const ASSETS=['./','./index.html','./app.css','./app.js','./game.js','./icon.svg','./manifest.webmanifest','../engine.js','../sovereign-continuum/engine.js'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(async cache=>{for(const path of ASSETS){try{await cache.add(path)}catch(_){/* Offline installation still works after a successful page visit */}}}).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('tabor-octopus-arsenal-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{const req=event.request;if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;
 const path=new URL(req.url).pathname;const ours=ASSETS.map(p=>new URL(p,self.registration.scope).pathname);
 if(!ours.includes(path))return;event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(response=>{if(response.ok){const c=response.clone();caches.open(CACHE).then(cache=>cache.put(req,c))}return response;})))});
