import {readFile} from "node:fs/promises";

const {CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN} = process.env;
if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
  throw new Error("Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN with Workers Scripts write access.");
}
const app = JSON.parse(await readFile(new URL("./app.json", import.meta.url), "utf8"));
const [worker,html] = await Promise.all([
  readFile(new URL("./worker.mjs",import.meta.url),"utf8"),
  readFile(new URL("./index.html",import.meta.url),"utf8")
]);
const form = new FormData();
form.append("metadata",new Blob([JSON.stringify({main_module:"worker.mjs",compatibility_date:"2026-11-19"})],{type:"application/json"}));
form.append("worker.mjs",new Blob([worker],{type:"application/javascript+module"}),"worker.mjs");
form.append("index.html",new Blob([html],{type:"text/plain"}),"index.html");
const root = "https://api.cloudflare.com/client/v4/accounts/"+encodeURIComponent(CLOUDFLARE_ACCOUNT_ID)+"/workers/scripts/"+encodeURIComponent(app.worker);
async function send(url,method,body,headers={}) {
  const response = await fetch(url,{method,body,headers:{...headers,Authorization:"Bearer "+CLOUDFLARE_API_TOKEN}});
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(method+" failed ("+response.status+"): "+JSON.stringify(result.errors));
}
await send(root,"PUT",form);
await send(root+"/subdomain","POST",JSON.stringify({enabled:true}),{"Content-Type":"application/json"});
console.log(app.origin);
