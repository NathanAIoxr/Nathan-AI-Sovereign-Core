import { DurableObject } from "cloudflare:workers";
import { embedText, embeddingModel } from "./index.js";

const quarter = 15 * 60 * 1000;
const snapshotKey = "blueprint-verified-snapshot-v1";
const bytes = new TextEncoder();
const columns = [
  "id","tier","domain","item_a_label","item_b_label","item_c_label","clue_prompt","core_parts","operations",
  "traits_attributes","scale_medium","input_output","flow_direction","modification_exemption","blind_spot_note",
];

async function hash(text) {
  const value = await crypto.subtle.digest("SHA-256", bytes.encode(text));
  return Array.from(new Uint8Array(value), b => b.toString(16).padStart(2,"0")).join("");
}

async function librarySnapshot(env, reindex) {
  const { results: rows } = await env.DB.prepare(`SELECT ${columns.map(key => "b." + key).join(",")}
    FROM blueprint_lessons b LEFT JOIN blueprint_lifecycle s ON s.lesson_id=b.id
    WHERE COALESCE(s.state,'verified')='verified' ORDER BY b.id`).all();
  const json = JSON.stringify(rows);
  const digest = await hash(json);
  const old = await env.CACHE.get(snapshotKey, "json");
  const key = "exports/verified/" + digest + ".json";
  if (!await env.VAULT.head(key)) {
    await env.VAULT.put(key, json, { httpMetadata: {contentType:"application/json"} });
  }
  if (old?.digest !== digest) await env.CACHE.put(snapshotKey, JSON.stringify({ digest, rows }));
  if (reindex) {
    const offset = Math.max(0, Number(await env.CACHE.get("academy-blueprint-index-offset")) || 0);
    const batch = rows.slice(offset, offset + 40);
    if (batch.length) {
      const { data } = await env.AI.run(embeddingModel, { text:batch.map(embedText) });
      if (data.length !== batch.length) throw new Error("Embedding batch mismatch");
      await env.VECTORIZE.upsert(batch.map((row,i) => ({ id:"blueprint-"+row.id, values:data[i] })));
    }
    await env.CACHE.put("academy-blueprint-index-offset", String(offset+batch.length<rows.length?offset+batch.length:0));
  }
  return { key, rows: rows.length };
}

async function check(env) {
  const utc = new Date();
  const onTheHour = utc.getUTCMinutes() < 15;
  let storage;
  try { storage = await librarySnapshot(env, onTheHour && utc.getUTCHours() === 4); }
  catch { /* record the binding results and preserve the previous snapshot */ }
  const tasks = {
    d1: () => env.DB.prepare("SELECT 1 AS ok FROM blueprint_lessons LIMIT 1").first(),
    kv: () => env.CACHE.get(snapshotKey, "json"),
    r2: () => storage ? env.VAULT.head(storage.key) : Promise.resolve(null),
    vectorize: async () => {
      const { data } = await env.AI.run(embeddingModel, {text:["motor and generator reverse energy conversion"]});
      return (await env.VECTORIZE.query(data[0],{topK:3})).matches.length > 0;
    },
  };
  const outcomes = await Promise.allSettled(Object.values(tasks).map(job => job()));
  const checks = Object.fromEntries(Object.keys(tasks).map((name,i) =>
    [name,outcomes[i].status==="fulfilled" && Boolean(outcomes[i].value)]));
  const healthy = Object.values(checks).every(Boolean);
  await env.DB.prepare(`INSERT INTO blueprint_health VALUES (1,unixepoch(),?,?)
    ON CONFLICT(id) DO UPDATE SET checked_at=excluded.checked_at,healthy=excluded.healthy,detail=excluded.detail`)
    .bind(+healthy,JSON.stringify(checks)).run();
  return checks;
}

export class BlueprintMaintenance extends DurableObject {
  async start() {
    if (await this.ctx.storage.getAlarm() === null) await this.ctx.storage.setAlarm(Date.now()+15000);
    return true;
  }

  async alarm() {
    const now = Date.now();
    await this.ctx.storage.setAlarm(Math.floor(now/quarter)*quarter+quarter);
    await check(this.env);
  }
}
