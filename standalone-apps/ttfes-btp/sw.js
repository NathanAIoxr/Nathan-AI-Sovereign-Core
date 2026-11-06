/* TTFES&BTP offline static shell. Never caches or uploads private user input. */
'use strict';
const CACHE='ttfes-btp-shell-v1';
const ASSETS=['./','./index.html','./styles.css','./catalog.js','./engine.js','./matrix-engine.js','./app.js','./matrix-ui.js','./icon.svg','./manifest.webmanifest'];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(async keys=>{
   await Promise.all(keys.filter(k=>k.startsWith('ttfes-btp-shell-')&&k!==CACHE).map(k=>caches.delete(k)));
   await self.clients.claim();
 }));
});
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET')return;
 const url=new URL(request.url);
 if(url.origin!==self.location.origin||!url.pathname.startsWith(new URL(self.registration.scope).pathname))return;
 event.respondWith(caches.match(request).then(hit=>hit||fetch(request).then(response=>{
   if(response.ok&&['script','style','document','image','manifest'].includes(request.destination)){
     const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy));
   }
   return response;
 })));
});
