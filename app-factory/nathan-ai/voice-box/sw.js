/* Offline shell only. Never intercept microphone, local files or private data. */
const CACHE='nathan-voice-box-shell-v1';
const PATHS=['./','./index.html','./app.js','./policy.js','./noise.js','./macro.js','./style.css','./manifest.webmanifest',
 '../appearance/shared.css','../appearance/engine.js','../appearance/app.js',
 '../launcher/shared.css','../assistant/engine.js','../launcher/engine.js','../launcher/app.js'];
const ASSETS=PATHS.map(p=>new URL(p,self.registration.scope).href);
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('nathan-voice-box-shell-')&&k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch',event=>{if(event.request.method!=='GET'||!ASSETS.includes(event.request.url))return;
 event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request)));});
