import { buildWorker, release } from "./build.mjs";

const { CLOUDFLARE_ACCOUNT_ID: account, CLOUDFLARE_API_TOKEN: token } = process.env;
if (!account || !token) throw new Error("Cloudflare account and token are required");
const namespace = "tabor-academy";
const script = "tabor-academy";
const moduleName = "worker.mjs";
const url = "https://api.cloudflare.com/client/v4/accounts/" + encodeURIComponent(account) +
  "/workers/dispatch/namespaces/" + namespace + "/scripts/" + script + "/content";

async function request(method, body) {
  const response = await fetch(url, {
    method, body, headers: { authorization: "Bearer " + token }, signal: AbortSignal.timeout(30_000)
  });
  if (!response.ok) throw new Error("Cloudflare Academy content " + method + " returned " + response.status);
  return response;
}
async function currentSource() {
  const form = await (await request("GET")).formData();
  const parts = [...form.keys()];
  if (parts.length !== 1 || parts[0] !== moduleName) throw new Error("Academy module layout changed");
  const main = form.get(moduleName);
  return typeof main === "string" ? main : main.text();
}
const current = await currentSource();
const updated = buildWorker(current);
if (current !== updated) {
  if (await currentSource() !== current) throw new Error("Academy changed during assembly. Retry against the latest release.");
  const form = new FormData();
  form.append("metadata", new Blob([JSON.stringify({ main_module: moduleName })], { type: "application/json" }));
  form.append(moduleName, new Blob([updated], { type: "application/javascript+module" }), moduleName);
  const { success, result } = await (await request("PUT", form)).json();
  if (!success) throw new Error("Academy rejected the Minds release");
  if (await currentSource() !== updated) throw new Error("Academy verification found different Worker source");
  console.log(JSON.stringify({ release, deployment: result?.deployment_id ?? null }));
} else {
  console.log(JSON.stringify({ release, alreadyDeployed: true }));
}
