'use strict';
const CACHE = 'one-sovereign-public-v1';
const ASSETS = ['./','./index.html','./style.css','./app.js','./manifest.webmanifest','./icon.svg'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('one-sovereign-public-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
  const url = new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==location.origin||event.request.headers.has('Authorization'))return;
  const allowed = ASSETS.map(asset=>new URL(asset,self.registration.scope).href);
  if(!allowed.includes(url.href))return;
  event.respondWith(fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}return response;}).catch(()=>caches.match(event.request)));
});
