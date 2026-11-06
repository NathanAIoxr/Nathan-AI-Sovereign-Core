/* Joy Studio optional installable PWA cache: static assets only. */
const CACHE='nathan-joy-studio-static-v2';
const ASSETS=['./','./index.html','./styles.css','./app.js','./manifest.webmanifest','./joy-icon-192.png','./joy-icon-512.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('nathan-joy-studio-static-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{const req=event.request;const u=new URL(req.url);if(req.method!=='GET'||u.origin!==self.location.origin)return;event.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(res=>{if(res.ok&&res.type==='basic'){const clone=res.clone();caches.open(CACHE).then(c=>c.put(req,clone));}return res;})));});
