/* NATHAN AI 🚀 — Consumer Editions: optional public-only offline directory.
 * Installed only after the user presses "Enable offline". Explicitly limited
 * to this folder and a seven-file allowlist. No private modules, uploads,
 * AI conversations, health files, media or cross-site requests are cached.
 * Network-first: when connected, the latest public notices win; offline
 * copies are time-bound references and are NOT current legal advice.
 */
'use strict';
const CACHE_PREFIX='nathan-consumer-public-';
const CACHE_NAME=CACHE_PREFIX+'2026-11-05-v1';
const PUBLIC_FILES=['./','./index.html','./app.js','./engine.js','./products.json','./jurisdictions.json','./data-practices.json','./manifest.webmanifest'];
const scopeUrl=new URL(self.registration.scope);
const allowed=new Set(PUBLIC_FILES.map(x=>new URL(x,scopeUrl).pathname));
self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(CACHE_NAME);
  await cache.addAll(PUBLIC_FILES.map(x=>new Request(new URL(x,scopeUrl),{cache:'reload'})));
  await self.skipWaiting();
 })());
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  const names=await caches.keys();
  await Promise.all(names.filter(n=>n.startsWith(CACHE_PREFIX)&&n!==CACHE_NAME).map(n=>caches.delete(n)));
  await self.clients.claim();
 })());
});
self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET'||req.mode==='no-cors')return;
 const url=new URL(req.url);
 // Scope and allowlist BOTH required, including for navigations.
 if(url.origin!==scopeUrl.origin||!url.pathname.startsWith(scopeUrl.pathname)||!allowed.has(url.pathname)||url.search)return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE_NAME);
  try{
   const response=await fetch(req);
   if(response.ok&&response.type==='basic')await cache.put(req,response.clone());
   return response;
  }catch(err){
   const cached=await cache.match(req,{ignoreSearch:false});
   if(cached)return cached;
   throw err;
  }
 })());
});
