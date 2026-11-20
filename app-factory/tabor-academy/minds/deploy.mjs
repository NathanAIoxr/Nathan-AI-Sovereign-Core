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
async function currentModules() {
  const form = await (await request("GET")).formData();
  const modules = {};
  for (const [name, part] of form) {
    if (!/^[A-Za-z0-9_.-]+\.mjs$/.test(name) || Object.hasOwn(modules, name)) {
      throw new Error("Unrecognized or duplicate Academy module");
    }
    modules[name] = typeof part === "string" ? part : await part.text();
  }
  if (!Object.hasOwn(modules, moduleName)) throw new Error("Academy Worker module is missing");
  const main = Object.keys(modules).length === 1 ? moduleName : "academy-entry.mjs";
  if (main !== moduleName && !modules[main]?.includes('from "./worker.mjs"')) {
    throw new Error("Academy entry module layout changed");
  }
  return { main, modules };
}
function snapshot(parts) {
  return JSON.stringify([parts.main, Object.entries(parts.modules).sort(([a], [b]) => a.localeCompare(b))]);
}
const current = await currentModules();
const updated = buildWorker(current.modules[moduleName]);
if (current.modules[moduleName] !== updated) {
  if (snapshot(await currentModules()) !== snapshot(current)) {
    throw new Error("Academy changed during assembly. Retry against the latest release.");
  }
  const expected = { ...current, modules: { ...current.modules, [moduleName]: updated } };
  const form = new FormData();
  form.append("metadata", new Blob([JSON.stringify({ main_module: current.main })], { type: "application/json" }));
  for (const [name, code] of Object.entries(expected.modules)) {
    form.append(name, new Blob([code], { type: "application/javascript+module" }), name);
  }
  const { success, result } = await (await request("PUT", form)).json();
  if (!success) throw new Error("Academy rejected the Minds release");
  if (snapshot(await currentModules()) !== snapshot(expected)) throw new Error("Academy verification found different modules");
  console.log(JSON.stringify({ release, deployment: result?.deployment_id ?? null }));
} else {
  console.log(JSON.stringify({ release, alreadyDeployed: true }));
}
