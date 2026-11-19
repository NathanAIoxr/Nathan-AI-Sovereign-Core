import {execFileSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import {readFile} from "node:fs/promises";

const {CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN} = process.env;
if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
  throw new Error("Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN with R2 write access.");
}
execFileSync(process.execPath,["--test",fileURLToPath(new URL("./game.test.mjs",import.meta.url))],{stdio:"inherit"});
const app = JSON.parse(await readFile(new URL("./app.json", import.meta.url), "utf8"));
const html = await readFile(new URL("./"+app.entry, import.meta.url));
const root = "https://api.cloudflare.com/client/v4/accounts/"+encodeURIComponent(CLOUDFLARE_ACCOUNT_ID);
const path = "/r2/buckets/"+encodeURIComponent(app.bucket)+"/objects/"+encodeURIComponent(app.entry);
const response = await fetch(root+path, {
  method:"PUT",
  headers:{Authorization:"Bearer "+CLOUDFLARE_API_TOKEN,"Content-Type":"text/html; charset=utf-8"},
  body:html,
  signal:AbortSignal.timeout(20_000)
});
const result = await response.json();
if (!response.ok || !result.success) throw new Error("Upload failed ("+response.status+"): "+JSON.stringify(result.errors));
const verificationUrl = new URL(app.origin);
verificationUrl.searchParams.set("deploy",String(Date.now()));
const live = await fetch(verificationUrl,{cache:"no-store",signal:AbortSignal.timeout(15_000)});
if (!live.ok || !(live.headers.get("content-type")||"").startsWith("text/html")) {
  throw new Error("Public HTML check failed ("+live.status+").");
}
if (!html.equals(Buffer.from(await live.arrayBuffer()))) throw new Error("Public response differs from the uploaded HTML.");
console.log(app.origin);
