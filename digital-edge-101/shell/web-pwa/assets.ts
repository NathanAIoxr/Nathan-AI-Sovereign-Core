export const html = `<!doctype html><html lang="en"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#131d2e">
<title>Nathan Tabor · Sovereign Edge OS</title><link rel="manifest" href="/manifest.webmanifest">
<style>html{background:#edf2f5;color:#14232e;font:16px/1.55 system-ui}body{max-width:76rem;padding:2rem 5vw;margin:auto}h1{font-size:clamp(2.3rem,7vw,5.6rem);line-height:.99;letter-spacing:-.055em;max-width:12ch;margin:.3em 0}a{color:#065778}li{margin:.55em 0}input,button{padding:.45em .65em;font:inherit}label{display:block;margin:.4em 0}pre{overflow:auto;background:#131d2e;color:#ebf6f5;border-radius:.5rem;padding:1rem}section{border-top:1px solid #8a9ba4;margin-top:1.8em}</style>
<h1>Sovereign Edge OS</h1>
<p>Nathan Tabor’s software-defined operating system. Find and run digital simulations and read-only utility fixtures.</p>
<nav><a href="/registry/os-syscall-table.json">505-ID registry</a> · <a href="/api/rings">Ring map</a> · <a href="/api/act">ACT Pi/Phi nodes</a> · <a href="/api/batch-proof">Background execution receipt</a></nav>
<section><h2>Run a syscall fixture</h2>
<form><label>Syscall ID <input name="id" value="OG-073" maxlength="6" pattern="(OG-)?[0-9]{3}"></label><button>Run sample</button></form>
<pre id="output" aria-live="polite">Try OG-073 for the historical calculator fixture or 016 for the FFT.</pre></section>
<section><h2>System rings</h2><ol start="0"><li>Microkernel and OG foundations</li><li>State, storage and consensus</li><li>Comms and protocol routing</li><li>Tool discovery and plan execution</li><li>Device utilities and web shell</li></ol></section>
<script src="/app.js" defer></script></html>`;
export const app = `
document.querySelector("form").addEventListener("submit",async e=>{
 e.preventDefault();
 const id=String(new FormData(e.target).get("id")), output=document.querySelector("#output");
 try{const res=await fetch("/api/modules/"+encodeURIComponent(id)+"/sample");output.textContent=JSON.stringify(await res.json(),null,2);}
 catch{output.textContent="The selected operation requires a network connection.";}
});
if("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(()=>{});
`;
export const serviceWorker = `
const cacheName="tabor-edge-os-shell-v1";
const publicAssets=["/","/app.js","/manifest.webmanifest","/icon.svg","/api/rings","/registry/os-syscall-table.json"];
self.addEventListener("install",event=>event.waitUntil(caches.open(cacheName).then(c=>c.addAll(publicAssets))));
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(names=>Promise.all(names.filter(n=>n.startsWith("tabor-edge-os-shell-")&&n!==cacheName).map(n=>caches.delete(n))))));
self.addEventListener("fetch",event=>{
 if(event.request.method!=="GET"||new URL(event.request.url).origin!==self.location.origin)return;
 const path=new URL(event.request.url).pathname;
 if(!publicAssets.includes(path))return;
 event.respondWith(fetch(event.request).catch(()=>caches.match(event.request).then(c=>c||new Response("Offline",{status:503}))));
});`;
export const icon='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect width="192" height="192" rx="30" fill="#131d2e"/><path d="M35 49h122v19h-51v76H86V68H35z" fill="#a3dee2"/></svg>';
export const manifest={name:"Nathan Tabor Sovereign Edge OS",short_name:"Sovereign Edge OS",id:"/",start_url:"/",display:"standalone",theme_color:"#131d2e",background_color:"#edf2f5",
 icons:[{src:"/icon.svg",sizes:"any",type:"image/svg+xml",purpose:"any"}]};
