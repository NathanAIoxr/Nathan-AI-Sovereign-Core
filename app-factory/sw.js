/* TABOR Factory public shell — offline support for named static files ONLY.
 * Do not cache OAuth callbacks, API responses, credentials, private user data,
 * query URLs or tenant-specific material. Any future backend needs its own domain.
 */
'use strict';
const CACHE='tabor-factory-static-v3';
const ROOT=new URL(self.registration.scope);
const ASSETS=[
  './','./index.html','./manifest.webmanifest','./icon.svg',
  './vault.html','./vault.js',
  './one/index.html','./one/one.js','./one/manifest.webmanifest',
  './games/crowning-jewel.html','./games/crowning-jewel.js','./games/manifest.webmanifest',
  './root-constellation.html',
  './tabor-gps/index.html','./tabor-gps/gps.js','./tabor-gps/manifest.webmanifest',
  './ecosystem.html','./products.json'
];
const URLS=new Set(ASSETS.map(path=>new URL(path,ROOT).pathname));
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS.map(p=>new URL(p,ROOT).href))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('tabor-factory-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET'||request.headers.has('authorization'))return;
  const url=new URL(request.url);
  if(url.origin!==ROOT.origin||url.search||!URLS.has(url.pathname))return;
  event.respondWith(
    fetch(request).then(response=>{
      if(response.ok&&response.type==='basic'){
        const copy=response.clone();
        event.waitUntil(caches.open(CACHE).then(cache=>cache.put(request,copy)));
      }
      return response;
    }).catch(async()=>await caches.match(request)||Response.error())
  );
});