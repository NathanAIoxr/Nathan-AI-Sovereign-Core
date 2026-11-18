import { KERNEL, SCALE, sha256 } from "./compute.mjs";

export const FABRIC_SHARD_TERMS = 131072;
export const FABRIC_SHARDS = 16;
export const FABRIC_TERMS = FABRIC_SHARD_TERMS * FABRIC_SHARDS;
const PARALLEL_CALLS = 4;

// Exponentiate the affine generator modulo 2^32. Consecutive shards start at
// the same states as a serial run, without generating earlier terms again.
export function advanceTerms(seed, terms) {
  let multiplier = 1664525;
  let increment = 1013904223;
  let state = seed;
  for (let steps = terms * 2; steps > 0; steps >>>= 1) {
    if (steps & 1) state = (Math.imul(state, multiplier) + increment) >>> 0;
    increment = (Math.imul(increment, multiplier) + increment) >>> 0;
    multiplier = Math.imul(multiplier, multiplier) >>> 0;
  }
  return state;
}

export function validSeed(seed) {
  return Number.isInteger(seed) && seed >= 0 && seed <= 0xffffffff;
}

function jobsFor(run_id, seed, terms, shards) {
  return Array.from({ length: shards }, (_, index) => {
    const global_offset = Math.floor(index * terms / shards);
    const count = Math.floor((index + 1) * terms / shards) - global_offset;
    return { run_id, index, global_offset, count, start: advanceTerms(seed, global_offset) };
  });
}

async function dispatch(executor, job) {
  const response = await executor.fetch("https://fabric.internal/execute", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(job),
  });
  if (!response.ok) throw new Error("Fabric shard did not complete");
  const result = await response.json();
  const maxProduct = 1023 * 1023;
  if (Object.entries(job).some(([key, value]) => result[key] !== value) ||
      result.kernel !== KERNEL || result.next_state !== advanceTerms(job.start, job.count) ||
      result.operations !== job.count * 2 || result.replay_verified !== true ||
      !Number.isSafeInteger(result.checksum) || result.checksum < 0 || result.checksum > job.count * maxProduct ||
      typeof result.invocation !== "string" || !result.invocation) {
    throw new Error("Fabric shard receipt failed validation");
  }
  const { run_id, ...shard } = job;
  return { ...shard, next_state: result.next_state, checksum: result.checksum,
    operations: result.operations, invocation: result.invocation };
}

export async function runFabric(executor, { seed, terms, shards }) {
  if (!validSeed(seed) || !Number.isInteger(shards) || shards < 1 || shards > FABRIC_SHARDS ||
      !Number.isInteger(terms) || terms < 64 || terms > FABRIC_SHARD_TERMS * shards) {
    throw new RangeError("Use a 32-bit unsigned seed, 1–16 shards, and 64–2097152 total terms, with at most 131072 terms per shard.");
  }
  const run_id = crypto.randomUUID();
  const jobs = jobsFor(run_id, seed, terms, shards);
  const started = Date.now();
  const results = [];
  for (let index = 0; index < jobs.length; index += PARALLEL_CALLS) {
    const group = jobs.slice(index, index + PARALLEL_CALLS);
    results.push(...await Promise.all(group.map(job => dispatch(executor, job))));
  }
  if (new Set(results.map(shard => shard.invocation)).size !== shards) throw new Error("Duplicate fabric invocation");
  const receipt = { run_id, profile: "fabric", kernel: KERNEL, seed, terms, operations: terms * 2,
    shard_count: shards, checksum: results.reduce((sum, shard) => sum + shard.checksum, 0),
    checksum_scale: SCALE, shards: results, replay_verified: true,
    verification: "per-shard-fp64-and-integer-replay", comparable_hpl: false, elapsed_ms: Date.now() - started };
  return { receipt, sha256: await sha256(JSON.stringify(receipt)) };
}
