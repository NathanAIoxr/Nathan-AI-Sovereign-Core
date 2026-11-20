import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const base = fileURLToPath(new URL(".", import.meta.url));
const path = filename => join(base, filename);
const read = filename => readFileSync(path(filename), "utf8");
const app = JSON.parse(read("app.json"));
const mount = process.argv.includes("--root") ? "" : app.mount;
const fullPath = route => mount + route;
const mountedHTML = source => source.replace(/(href|src)="\/(?!\/)/gu, '$1="' + mount + "/");
const escape = value => value.replace(/[&<>"']/gu, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[char]);
const links = '<header class="top"><a href="/" class="logo">'+escape(app.short_name)+'</a><nav><a href="/#play">Play</a><a href="/#install">Install</a></nav></header>';
const html = (title, content) => '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>'+escape(title)+'</title><link rel="stylesheet" href="/style.css"></head><body>'+links+'<main>'+content+'</main></body></html>';
const types = {
  ".html":"text/html; charset=utf-8", ".mjs":"text/javascript; charset=utf-8",
  ".css":"text/css; charset=utf-8", ".pdf":"application/pdf", ".png":"image/png"
};
const assets = {};
function addAsset(route, type, body) {
  const contents = type === types[".html"] ? mountedHTML(String(body)) : body;
  assets[fullPath(route)] = {type,body:Buffer.from(contents).toString("base64")};
}
for (const file of readdirSync(path("public"))) {
  addAsset(file === "index.html" ? "/" : "/"+file, types[extname(file)], readFileSync(path("public/"+file)));
}
if (app.reader === "/book") {
  const book = JSON.parse(read("book.json"));
  const chapters = book.chapters.map(chapter => '<article class="chapter"><h2>'+escape(chapter.title)+'</h2>'+chapter.paras.map(para => '<p>'+escape(para)+'</p>').join("")+'</article>').join("");
  const sources = book.sources.map(([name,url]) => '<li><a href="'+escape(url)+'">'+escape(name)+'</a></li>').join("");
  const opening = '<div class="booktop"><p class="eyebrow">'+escape(book.credit)+'</p><h1>'+escape(book.title)+'</h1><p class="lede">'+escape(book.subtitle)+'</p><p><a href="/The-Two-Plate-Reckoning.pdf">Download the PDF edition ↓</a></p></div>';
  addAsset("/book", types[".html"], html(book.title,opening+chapters+'<article class="chapter"><h2>Sources &amp; scripture</h2><ul>'+sources+'</ul></article>'));
} else {
  const series = JSON.parse(read("series.json"));
  const volumes = series.map(([title,summary],index) => '<article class="volume"><h2>'+String(index+1)+'. '+escape(title)+'</h2><p>'+escape(summary)+'</p></article>').join("");
  const opening = '<div class="series"><p class="tag">THE 13-VOLUME SERIES MAP</p><h1>The Chronicles of Hat &amp; Hatette</h1><p>Thirteen book concepts from '+escape(app.title)+'.</p>';
  addAsset("/series",types[".html"],html("The Chronicles of Hat & Hatette",opening+volumes+'</div>'));
}
addAsset("/manifest.webmanifest","application/manifest+json",JSON.stringify({
  id:fullPath("/"),name:app.title,short_name:app.short_name,start_url:fullPath("/"),scope:fullPath("/"),display:"standalone",theme_color:app.theme_color,background_color:app.theme_color,
  icons:[192,512].map(size=>({src:fullPath("/icon-"+size+".png"),sizes:size+"x"+size,type:"image/png"}))
}));
const cachePrefix = app.id + "-shell-";
const cacheName = cachePrefix+createHash("sha256").update(JSON.stringify(assets)).digest("hex").slice(0,12);
const sw = `
const cacheName = ${JSON.stringify(cacheName)};
const paths = ${JSON.stringify(Object.keys(assets))};
self.addEventListener("install", event => event.waitUntil(caches.open(cacheName).then(cache => cache.addAll(paths)).then(() => self.skipWaiting())));
self.addEventListener("activate", event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(${JSON.stringify(cachePrefix)}) && key !== cacheName).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin || !paths.includes(url.pathname)) return;
  event.respondWith(caches.open(cacheName).then(cache => cache.match(url.pathname)).then(cached => cached || fetch(event.request)));
});
`;
addAsset("/sw.js",types[".mjs"],sw);
const worker = `
const assets = ${JSON.stringify(assets)};
const security = {
  "Content-Security-Policy": "default-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin"
};
export default {
  fetch(request) {
    if (!["GET","HEAD"].includes(request.method)) return new Response("Method not allowed",{status:405,headers:{...security,Allow:"GET, HEAD"}});
    const url = new URL(request.url);
    const route = url.pathname;
    const mount = ${JSON.stringify(mount)};
    if (mount && route === mount) {
      url.pathname += "/";
      return Response.redirect(url, 308);
    }
    const key = route.length > mount.length + 1 && route.endsWith("/") ? route.slice(0,-1) : route;
    if (!Object.hasOwn(assets,key)) return new Response(request.method === "HEAD" ? null : "Not found",{status:404,headers:security});
    const asset = assets[key];
    const headers = {...security,"Content-Type":asset.type,"Cache-Control":"no-cache"};
    return new Response(request.method === "HEAD" ? null : Uint8Array.from(atob(asset.body), char => char.charCodeAt(0)),{headers});
  }
};
`;
writeFileSync(process.argv[2] ?? path("worker.mjs"), worker);
