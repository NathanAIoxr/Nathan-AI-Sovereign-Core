const cacheName="tabor-tracker-ball-1.2.0";
const shell=[".","index.html","style.css","app.mjs","track-baller.mjs","digit-input.mjs","games.mjs","render.mjs","manifest.webmanifest","icon.svg","catalog.json","loc101.html","loc101.css","loc101.mjs","loc101-catalog.mjs","loc101-core.mjs","loc101-view.mjs"].map(name=>new URL(name,self.registration.scope).pathname);
for(const path of [
  "standalone-apps/tactilecore-sdk/src/engine.mjs",
  "standalone-apps/hook-and-ring/game/input.mjs",
  "standalone-apps/hook-and-ring/game/physics.mjs",
]){
  shell.push(new URL("../../../"+path,self.registration.scope).pathname);
}
self.addEventListener("install",event=>event.waitUntil(caches.open(cacheName).then(cache=>cache.addAll(shell))));
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(
  keys.filter(key=>key.startsWith("tabor-tracker-ball-")&&key!==cacheName).map(key=>caches.delete(key))
)).then(()=>self.clients.claim())));
self.addEventListener("fetch",event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=="GET"||url.origin!==self.location.origin) return;
  if(!shell.includes(url.pathname)) return;
  event.respondWith(fetch(request).then(response=>{
    if(response.ok) event.waitUntil(caches.open(cacheName).then(cache=>cache.put(url.pathname,response.clone())).catch(()=>{}));
    return response;
  }).catch(async()=>(await caches.match(url.pathname))??new Response("Offline",{status:503})));
});
