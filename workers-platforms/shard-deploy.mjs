import { setTimeout as pause } from "node:timers/promises";
import { namespace, platforms, source } from "./platforms.mjs";
import { shardCount, shardId, shardTag } from "./shard-routes.mjs";

const namespacePath = `/workers/dispatch/namespaces/${namespace}`;
const slotLimit = 1000;

function readCatalog(text) {
  const shards = text.trim().split("\n").map((line) => JSON.parse(line));
  if (shards.length !== shardCount) throw new Error("Expected 989 catalog shards");
  let previous = "";
  let recordCount = 0;
  for (const [index, shard] of shards.entries()) {
    const { id, first, last, records } = shard;
    if (id !== shardId(index + 1) || shard.source !== source.title || !Array.isArray(records)
        || records.length < 27 || records.length > 28 || first !== records[0].id
        || last !== records.at(-1).id) throw new Error("Invalid shard at position " + (index + 1));
    for (const record of records) {
      if (!/^[a-z0-9]{4}[0-9]{4}$/.test(record.id) || record.id <= previous) {
        throw new Error("Invalid or repeated Glottocode: " + record.id);
      }
      previous = record.id;
      recordCount++;
    }
  }
  if (recordCount !== 27275) throw new Error("Unexpected release record count");
  return shards;
}

async function inventory(api) {
  const scripts = new Map();
  const cursors = new Set();
  let cursor = "";
  do {
    const query = cursor ? "?cursor=" + encodeURIComponent(cursor) : "";
    const page = await api("GET", namespacePath + "/scripts" + query, undefined, true);
    for (const item of page.result) scripts.set(item.id, item);
    cursor = page.result_info?.cursor || "";
    if (cursor && cursors.has(cursor)) throw new Error("Repeated Cloudflare inventory cursor");
    cursors.add(cursor);
  } while (cursor);
  const state = await api("GET", namespacePath);
  if (scripts.size !== state.script_count) throw new Error("Cloudflare inventory changed or was incomplete. Run again.");
  return scripts;
}

async function upload(api, shard, code) {
  for (let attempt = 0; ; attempt++) {
    const form = new FormData();
    form.append("metadata", new Blob([JSON.stringify({
      main_module: "shard.mjs", compatibility_date: "2026-11-18", tags: [shardTag]
    })], { type: "application/json" }));
    for (const [file, content] of [["shard.mjs", code], ["data.mjs", "export default " + JSON.stringify(shard) + ";"]]) {
      form.append(file, new Blob([content], { type: "application/javascript+module" }), file);
    }
    try {
      await api("PUT", namespacePath + "/scripts/" + shard.id, form);
      return;
    } catch (error) {
      if (attempt >= 2 || ![502, 503, 504].includes(error.status)) throw error;
      await pause(1000 * 2 ** attempt);
    }
  }
}

export async function reconcileShards(api, text, code) {
  const shards = readCatalog(text);
  const current = await inventory(api);
  for (const platform of platforms) {
    if (!current.has(platform.id)) throw new Error("Missing core platform " + platform.id);
  }
  for (const shard of shards) {
    if (current.has(shard.id) && !current.get(shard.id).tags?.includes(shardTag)) {
      throw new Error("Existing script uses the reserved name " + shard.id);
    }
  }
  const missing = shards.filter(({ id }) => !current.has(id));
  if (current.size + missing.length > slotLimit) throw new Error("Deployment would exceed the 1,000-script allocation");
  for (let i = 0; i < missing.length; i += 8) {
    const outcomes = await Promise.allSettled(missing.slice(i, i + 8).map((shard) => upload(api, shard, code)));
    const failed = outcomes.find(({ status }) => status === "rejected");
    if (failed) throw failed.reason;
    if (i % 80 === 0) console.log(`Uploaded ${Math.min(i + 8, missing.length)} of ${missing.length} missing scripts`);
  }
  const verified = await inventory(api);
  if (verified.size !== slotLimit || shards.some(({ id }) => !verified.get(id)?.tags?.includes(shardTag))) {
    throw new Error("Final Cloudflare inventory did not match the catalog");
  }
  console.log(`Verified ${shardCount} tagged catalog shards and ${verified.size} total scripts`);
}
