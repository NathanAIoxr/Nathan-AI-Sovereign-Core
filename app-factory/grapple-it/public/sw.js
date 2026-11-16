
const cacheName='grapple-it-v3';
const shell=['./','./index.html','./grapple.css','./grapple.mjs','./grapple-ui.mjs','./toy.mjs','./toy-ui.mjs','./campaign.mjs','./campaign-ui.mjs','./roster.mjs','./arcade-engine.mjs','./arcade-ui.mjs','./icon.svg','./manifest.webmanifest'];
self.addEventListener('install',event=>event.waitUntil(caches.open(cacheName).then(cache=>cache.addAll(shell)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('grapple-it-')&&key!==cacheName).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||!url.href.startsWith(self.registration.scope))return;
 event.respondWith(fetch(event.request).catch(()=>caches.match(event.request).then(hit=>hit||(event.request.mode==='navigate'?caches.match('./'):Response.error()))));
});
