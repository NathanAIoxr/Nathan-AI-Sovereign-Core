import {readFile} from "node:fs/promises";

const {CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN} = process.env;
if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
  throw new Error("Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN with R2 write access.");
}
const app = JSON.parse(await readFile(new URL("./app.json", import.meta.url), "utf8"));
const html = await readFile(new URL("./"+app.entry, import.meta.url));
const root = "https://api.cloudflare.com/client/v4/accounts/"+encodeURIComponent(CLOUDFLARE_ACCOUNT_ID);
const path = "/r2/buckets/"+encodeURIComponent(app.bucket)+"/objects/"+encodeURIComponent(app.entry);
const response = await fetch(root+path, {
  method:"PUT",
  headers:{Authorization:"Bearer "+CLOUDFLARE_API_TOKEN,"Content-Type":"text/html; charset=utf-8"},
  body:html
});
const result = await response.json();
if (!response.ok || !result.success) throw new Error("Upload failed ("+response.status+"): "+JSON.stringify(result.errors));
console.log(app.origin);
