
const cacheName='grapple-it-v8';
const shell=['./','./index.html','./grapple.css','./grapple.mjs','./grapple-ui.mjs','./toy.mjs','./toy-ui.mjs','./campaign.mjs','./campaign-ui.mjs','./arcade.mjs','./swing.mjs','./expansion-ui.mjs','./roster.mjs','./arcade-engine.mjs','./arcade-ui.mjs','./icon.svg','./manifest.webmanifest','./daily-board.mjs','./daily-replay.mjs','./fixed-clock.mjs','./tactile-input.mjs','./tactile-filter.mjs','./track-baller.mjs','./rope.mjs','./precision-bridge.mjs','./frame-loop.mjs','./atlas.mjs','./atlas-ui.mjs'];
self.addEventListener('install',event=>event.waitUntil(caches.open(cacheName).then(cache=>cache.addAll(shell)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('grapple-it-')&&key!==cacheName).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
const paths=new Set(shell.map(path=>new URL(path,self.registration.scope).pathname));
self.addEventListener('fetch',event=>{
 const {request}=event;
 const url=new URL(request.url);
 if(request.method!=='GET'||!url.href.startsWith(self.registration.scope)||!paths.has(url.pathname))return;
 event.respondWith((async()=>{
  const fallback=async()=>caches.open(cacheName).then(cache=>cache.match(request,{ignoreSearch:true}));
  try{
   const response=await fetch(request);
   if(response.status<500)return response;
   return await fallback()??response;
  }catch{
   return await fallback()??Response.error();
  }
 })());
});
