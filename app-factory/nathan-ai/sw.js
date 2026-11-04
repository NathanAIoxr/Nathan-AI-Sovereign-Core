/* Only the explicitly selected public core screens are stored. No runtime cache. */
'use strict';
const CACHE='nathan-ai-public-core-v2';
const ROOT=new URL(self.registration.scope);
let allowed;
async function paths(){
  if(!allowed){
    const r=await fetch(new URL('offline-assets.json',ROOT),{cache:'no-store'});
    if(!r.ok)throw Error('Offline asset list unavailable');
    const entries=await r.json();
    if(!Array.isArray(entries)||entries.some(p=>typeof p!=='string'||p.includes('?')||p.includes('#')||new URL(p,ROOT).origin!==ROOT.origin))throw Error('Invalid offline asset list');
    allowed=entries.map(p=>new URL(p,ROOT).href);
  }
  return allowed;
}
self.addEventListener('install',event=>event.waitUntil((async()=>{
  const urls=await paths(),cache=await caches.open(CACHE);
  await cache.addAll([...urls,new URL('offline-assets.json',ROOT).href]);
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  for(const key of await caches.keys())if(key.startsWith('nathan-ai-public-core-')&&key!==CACHE)await caches.delete(key);
  await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
  const req=event.request,url=new URL(req.url);
  if(req.method!=='GET'||url.origin!==ROOT.origin||url.search||url.pathname.includes('/api/'))return;
  event.respondWith((async()=>{
    let urls;try{urls=await paths()}catch(e){const cached=await (await caches.open(CACHE)).match(new URL('offline-assets.json',ROOT).href);urls=cached?(await cached.json()).map(p=>new URL(p,ROOT).href):[];}
    if(!urls.includes(url.href))return fetch(req);
    try{return await fetch(req)}catch(e){return (await (await caches.open(CACHE)).match(req))||Response.error();}
  })());
});
