import { KERNEL, SCALE, replay } from "./compute.mjs";
import { FABRIC_SHARDS, FABRIC_SHARD_TERMS, FABRIC_TERMS, validSeed } from "./fabric.mjs";
import { readJsonObject } from "./request.mjs";

const UUID = /^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/;

function floatingDot(start, count) {
  let state = start;
  let sum = 0;
  for (let term = 0; term < count; term += 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const left = (state >>> 22) / 1024;
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    sum += left * ((state >>> 22) / 1024);
  }
  return { checksum: sum * SCALE, state };
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.origin !== "https://fabric.internal" || url.pathname !== "/execute" || request.method !== "POST") {
      return Response.json({ error: "Route not found" }, { status: 404 });
    }
    const job = await readJsonObject(request, 2 * 1024).catch(() => null);
    const { run_id, index, global_offset, count, start } = job ?? {};
    if (typeof run_id !== "string" || !UUID.test(run_id) || !validSeed(start) ||
        !Number.isInteger(index) || index < 0 || index >= FABRIC_SHARDS ||
        !Number.isInteger(global_offset) || global_offset < 0 ||
        !Number.isInteger(count) || count < 1 || count > FABRIC_SHARD_TERMS ||
        global_offset + count > FABRIC_TERMS) {
      return Response.json({ error: "Invalid fabric shard" }, { status: 400 });
    }
    const measured = floatingDot(start, count);
    const verified = replay(start, count);
    if (measured.checksum !== verified.checksum || measured.state !== verified.state) {
      return Response.json({ error: "Fabric shard replay mismatch" }, { status: 503 });
    }
    return Response.json({ run_id, index, global_offset, count, start, next_state: measured.state,
      kernel: KERNEL, checksum: measured.checksum, operations: count * 2,
      replay_verified: true, invocation: crypto.randomUUID() });
  },
};
