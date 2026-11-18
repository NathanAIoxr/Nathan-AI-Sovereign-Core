import {factory} from "./factory.mjs";

export const manifest = {
  id:"/",
  name:".:. My stack of cannon balls",
  short_name:"Tabor World",
  description:"Rhythm Matrix, Slayers & Sleyers, and the Tabor 1-2-3 Factory.",
  start_url:"/",
  scope:"/",
  display:"standalone",
  background_color:"#100f15",
  theme_color:"#100f15",
  icons:[192,512].map(size=>({src:"/icon-"+size+".png",sizes:size+"x"+size,type:"image/png",purpose:"any"})),
  shortcuts:[
    {name:"Slayers & Sleyers",url:"/slayers-sleyers/"},
    {name:"Tabor 1-2-3 Factory",url:"/factory/"}
  ]
};

export const installer = String.raw`
if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(()=>{});
`;

const shell = [
  "/", "/app.js", "/words.js", "/install.js", "/manifest.webmanifest", "/tabor.css", "/icon-192.png", "/icon-512.png",
  "/slayers-sleyers/", "/slayers-sleyers/engine.js", "/slayers-sleyers/app.js",
  "/factory/", "/factory/app.js", ...factory.map(app=>app.path),
  "/api/score", "/api/will-wheel-way", "/api/catalog", "/api/factory"
];
export const offline = "const shell = new Set("+JSON.stringify(shell)+");\n"+String.raw`
const shellCache = "tabors-cannonballs-shell-v2";
self.addEventListener("install",event=>event.waitUntil(caches.open(shellCache).then(cache=>cache.addAll([...shell]))));
self.addEventListener("activate",event=>event.waitUntil((async()=>{
  const keys = await caches.keys();
  await Promise.all(keys.filter(key=>key.startsWith("tabors-cannonballs-shell-") && key!==shellCache).map(key=>caches.delete(key)));
  await self.clients.claim();
})()));
self.addEventListener("fetch",event=>{
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || url.search || !shell.has(url.pathname)) return;
  event.respondWith(fetch(request).catch(async()=>{
    const cache = await caches.open(shellCache);
    return (await cache.match(request)) || new Response("Offline", {status:503});
  }));
});
`;
