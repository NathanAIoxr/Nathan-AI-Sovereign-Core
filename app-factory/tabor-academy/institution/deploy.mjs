import { readFile, readdir } from "node:fs/promises";
import { blueprintKey, blueprintSource, buildWorker, release } from "./build.mjs";

const root = new URL("./", import.meta.url);
const load = path => readFile(new URL(path, root), "utf8");
const config = JSON.parse(await load("cloudflare.json"));
const { CLOUDFLARE_ACCOUNT_ID: account, CLOUDFLARE_API_TOKEN: token } = process.env;
if (!account || !token) throw new Error("Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN for deployment");

const api = "https://api.cloudflare.com/client/v4/accounts/" + encodeURIComponent(account);
const script = "/workers/dispatch/namespaces/" + config.namespace + "/scripts/" + config.worker;
async function request(path, { method = "GET", body, contentType } = {}) {
  const headers = { authorization: "Bearer " + token };
  if (contentType) headers["content-type"] = contentType;
  const response = await fetch(api + path, { method, headers, body, signal: AbortSignal.timeout(45_000) });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(method + " " + path + " returned " + response.status + " " +
      (error.errors ?? []).map(entry => entry.message).join("; "));
  }
  return response;
}
async function readJSON(path, options) {
  const data = await (await request(path, options)).json();
  if (!data.success || (Array.isArray(data.result) && data.result.some(item => item.success === false))) {
    throw new Error("Cloudflare returned an unsuccessful result for " + path);
  }
  return data.result;
}
async function dbQuery(sql, params) {
  return readJSON("/d1/database/" + config.database + "/query", {
    method: "POST", contentType: "application/json", body: JSON.stringify({ sql, params }),
  });
}
async function getContent() {
  const response = await request(script + "/content");
  const form = await response.formData();
  if ([...form.keys()].join() !== "worker.mjs") throw new Error("Current Academy needs a multi-module deployment");
  const module = form.get("worker.mjs");
  if (!module) throw new Error("Current Academy module was missing");
  return typeof module === "string" ? module : module.text();
}
const settings = await readJSON(script + "/settings");
const expected = { ACADEMY_DB: config.database, ACADEMY_CACHE: config.cache, ACADEMY_LIBRARY: config.bucket };
for (const [name, id] of Object.entries(expected)) {
  const binding = settings.bindings.find(entry => entry.name === name);
  if (!binding || ![binding.id, binding.database_id, binding.namespace_id, binding.bucket_name].includes(id)) {
    throw new Error("Cloudflare binding " + name + " is missing or points to another resource");
  }
}
const migrations = (await readdir(new URL("migrations/", root))).filter(name => /^\d{4}_[a-z_]+\.sql$/.test(name)).sort();
await dbQuery("CREATE TABLE IF NOT EXISTS academy_schema_migrations (name TEXT PRIMARY KEY, applied_at TEXT DEFAULT CURRENT_TIMESTAMP)");
const applied = new Set((await dbQuery("SELECT name FROM academy_schema_migrations"))[0].results.map(row => row.name));
for (const name of migrations) {
  if (applied.has(name)) continue;
  // Each migration can be retried after interruption before its receipt is written.
  await dbQuery(await load("migrations/" + name));
  await dbQuery("INSERT INTO academy_schema_migrations (name) VALUES (?) ON CONFLICT(name) DO NOTHING", [name]);
}

const object = "/r2/buckets/" + config.bucket + "/objects/" + encodeURIComponent(blueprintKey);
let objectFound = false;
try {
  const current = await (await request(object)).text();
  if (current !== blueprintSource) throw new Error("Blueprint version already exists with different bytes. Bump its version.");
  objectFound = true;
} catch (error) {
  if (!error.message.startsWith("GET " + object + " returned 404")) throw error;
}
if (!objectFound) {
  await readJSON(object, { method: "PUT", contentType: "application/json", body: blueprintSource });
}

const before = await getContent();
const updated = buildWorker(before);
if (updated !== before) {
  const checked = await getContent();
  if (checked !== before) throw new Error("Academy source changed during assembly. Retry with the latest source.");
  const form = new FormData();
  form.append("metadata", new Blob([JSON.stringify({ main_module: "worker.mjs" })], { type: "application/json" }));
  form.append("worker.mjs", new Blob([updated], { type: "application/javascript+module" }), "worker.mjs");
  const deployment = await readJSON(script + "/content", { method: "PUT", body: form });
  console.log("Cloudflare deployment", deployment.deployment_id, release);
} else {
  console.log("Cloudflare is already serving Institution release", release);
}
