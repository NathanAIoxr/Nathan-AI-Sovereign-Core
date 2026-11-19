import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const account = process.env.CLOUDFLARE_ACCOUNT_ID;
const token = process.env.CLOUDFLARE_API_TOKEN;
if (!account || !token) throw new Error("Cloudflare account and Workers API token are required.");

const output = resolve(process.argv[2] || "build-output");
const manifest = JSON.parse(await readFile(resolve(output, "manifest.json"), "utf8"));
for (const unit of manifest) {
  const form = new FormData();
  form.append("metadata", new Blob([await readFile(resolve(output, unit.id + ".json"))], { type: "application/json" }));
  form.append("worker.mjs", new Blob([await readFile(resolve(output, unit.id + ".mjs"))], {
    type: "application/javascript+module",
  }), "worker.mjs");
  const endpoint = "https://api.cloudflare.com/client/v4/accounts/" + encodeURIComponent(account) +
    "/workers/dispatch/namespaces/" + unit.namespace + "/scripts/" + unit.worker;
  const response = await fetch(endpoint, {
    method: "PUT", headers: { Authorization: "Bearer " + token }, body: form, signal: AbortSignal.timeout(30_000),
  });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(unit.id + " upload: " + JSON.stringify(result.errors));
  console.log("Published " + unit.worker);
}

for (const unit of manifest) {
  let matched = false;
  for (let attempt = 0; attempt < 5 && !matched; attempt++) {
    try {
      const response = await fetch(unit.url + "healthz", { signal: AbortSignal.timeout(12000) });
      matched = response.ok && (await response.json()).release === unit.release;
    } catch { /* Retry during edge propagation. */ }
    if (!matched && attempt < 4) await new Promise(resolve => setTimeout(resolve, 4000));
  }
  if (!matched) throw new Error("Live release digest mismatch for " + unit.id);
  console.log("Verified " + unit.url);
}
