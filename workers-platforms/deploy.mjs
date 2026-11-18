import { readFile } from "node:fs/promises";
import { reconcileShards } from "./shard-deploy.mjs";
import { hubName, namespace, owner, platforms } from "./platforms.mjs";

const [target, catalogPath, ...extra] = process.argv.slice(2);
const platform = platforms.find(({ id }) => id === target);
if (extra.length || (!platform && !["hub", "shards"].includes(target)) || Boolean(catalogPath) !== (target === "shards")) {
  throw new Error("Choose a platform ID, hub, or shards <generated NDJSON>");
}

const { CLOUDFLARE_ACCOUNT_ID: account, CLOUDFLARE_API_TOKEN: token } = process.env;
if (!/^[0-9a-f]{32}$/.test(account ?? "") || !token) throw new Error("Set Cloudflare account ID and API token");
const root = `https://api.cloudflare.com/client/v4/accounts/${account}`;
const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

async function api(method, path, body, envelope = false) {
  const headers = { authorization: `Bearer ${token}` };
  if (body && !(body instanceof FormData)) {
    headers["content-type"] = "application/json";
    body = JSON.stringify(body);
  }
  const response = await fetch(root + path, { method, headers, body, signal: AbortSignal.timeout(60000) });
  const data = await response.json();
  if (!response.ok || !data.success) {
    const error = new Error(`${method} ${path} failed (${response.status}): ${data.errors?.map(({ message }) => message).join("; ")}`);
    error.status = response.status;
    throw error;
  }
  return envelope ? data : data.result;
}

async function upload(path, entry, bindings, limits) {
  const form = new FormData();
  const metadata = { main_module: entry, compatibility_date: "2026-11-18", bindings, limits };
  form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
  const modules = [entry, "platforms.mjs", "view.mjs"];
  if (entry === "dispatch.mjs") modules.push("shard-routes.mjs");
  for (const file of modules) {
    form.append(file, new Blob([await read(file)], { type: "application/javascript+module" }), file);
  }
  await api("PUT", path, form);
}

if (target === "hub") {
  await upload(`/workers/scripts/${hubName}`, "dispatch.mjs",
    [{ name: "PLATFORMS", type: "dispatch_namespace", namespace }], { cpu_ms: 50 });
} else if (target === "shards") {
  await reconcileShards(api, await readFile(catalogPath, "utf8"), await read("shard.mjs"));
} else {
  const name = "tabor-platform-" + target;
  const matches = (await api("GET", "/d1/database?name=" + encodeURIComponent(name))).filter((db) => db.name === name);
  if (matches.length !== 1) throw new Error(`Expected one dedicated D1 database named ${name}`);
  const id = matches[0].uuid;
  const query = (sql, params = []) => api("POST", `/d1/database/${id}/query`, { sql, params });
  await query(await read("schema.sql"));
  if (target === "languages") {
    const result = await query("SELECT id FROM catalog_release WHERE id = 'glottolog-cldf-v5.4'");
    if (result[0]?.results.length !== 1) throw new Error("Import the Glottolog release first");
  }
  await query(`INSERT INTO platform_record VALUES(?,?,?,?,?) ON CONFLICT(id)
    DO UPDATE SET owner=excluded.owner,title=excluded.title,purpose=excluded.purpose,links_json=excluded.links_json`,
    [target, owner, platform.title, platform.purpose, JSON.stringify(platform.links)]);
  await upload(`/workers/dispatch/namespaces/${namespace}/scripts/${target}`, "tenant.mjs",
    [{ name: "DB", type: "d1", id }, { name: "PLATFORM_ID", type: "plain_text", text: target }]);
}
console.log(`Deployed ${target}`);
