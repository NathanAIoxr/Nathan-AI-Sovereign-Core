const scope=self.registration.scope;
const cacheName='snow-globes-v2:'+scope;
const names=['./','app.js','physics.js','style.css','chapters.json','manifest.webmanifest','icon.svg','icon-192.png','icon-512.png','architecture.svg'];
self.addEventListener('install',event=>event.waitUntil(caches.open(cacheName).then(cache=>cache.addAll(names.map(n=>new URL(n,scope).href)))));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  for(const key of await caches.keys())if(key.startsWith('snow-globes-')&&key.endsWith(':'+scope)&&key!==cacheName)await caches.delete(key);
  await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
  const req=event.request, url=new URL(req.url);
  if(req.method!=='GET'||!url.href.startsWith(scope))return;
  const key=req.mode==='navigate'?scope:url.href;
  if(!names.some(n=>new URL(n,scope).href===key))return;
  event.respondWith((async()=>{
    const cache=await caches.open(cacheName);
    try{const res=await fetch(req);if(res.ok)await cache.put(key,res.clone());return res;}
    catch{const cached=await cache.match(key);return cached||new Response('Offline asset unavailable',{status:503});}
  })());
});
