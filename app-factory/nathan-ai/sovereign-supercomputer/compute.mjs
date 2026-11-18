// The deployed executor accepts four shards and 16,384 terms per logical bank.
export const BANK_TERMS = 16384;
export const BANK_SHARDS = 4;
export const MAX_TERMS = BANK_TERMS * 2;
export const MAX_SHARDS = BANK_SHARDS * 2;
export const SCALE = 1048576;
export const KERNEL = "fp64-dot-lcg32-v1";
const advance = state => (Math.imul(state, 1664525) + 1013904223) >>> 0;

export async function sha256(text) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

// Replay exact scaled integer products independently of the executor's FP64 code.
export function replay(seed, terms) {
  let state = seed;
  let checksum = 0;
  for (let term = 0; term < terms; term += 1) {
    state = advance(state);
    const left = state >>> 22;
    state = advance(state);
    checksum += left * (state >>> 22);
  }
  return { checksum, state };
}

function plan(seed, terms, shards) {
  const banks = Math.max(Math.ceil(terms / BANK_TERMS), Math.ceil(shards / BANK_SHARDS));
  const jobs = [];
  let start = seed;
  let totalOffset = 0;
  for (let bank = 0; bank < banks; bank += 1) {
    const bankTerms = Math.floor(terms * (bank + 1) / banks) - totalOffset;
    const bankShards = Math.floor(shards * (bank + 1) / banks) - jobs.length;
    let offset = 0;
    for (let index = 0; index < bankShards; index += 1) {
      const count = Math.floor(bankTerms * (index + 1) / bankShards) - offset;
      const expected = replay(start, count);
      jobs.push({
        bank, index, start, count, offset, global_offset: totalOffset + offset,
        slot: (seed + jobs.length) % 320, expected: expected.checksum,
      });
      start = expected.state;
      offset += count;
    }
    totalOffset += bankTerms;
  }
  return jobs;
}

export async function runFp64(executor, { seed = 73, terms = MAX_TERMS, shards = MAX_SHARDS } = {}) {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff ||
      !Number.isInteger(terms) || terms < 64 || terms > MAX_TERMS ||
      !Number.isInteger(shards) || shards < Math.ceil(terms / BANK_TERMS) || shards > MAX_SHARDS) {
    throw new RangeError("Use a 32-bit unsigned seed, 64–32768 terms, and 1–8 shards with at least one per bank.");
  }
  const run_id = crypto.randomUUID();
  const started = Date.now();
  const results = await Promise.all(plan(seed, terms, shards).map(async job => {
    const { bank, global_offset, expected, ...shard } = job;
    const response = await executor.fetch("https://executor.internal/execute", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ run_id, ...shard }),
    });
    if (!response.ok) throw new Error("Executor rejected a shard");
    const result = await response.json();
    for (const [key, value] of Object.entries({ run_id, ...shard })) {
      if (result[key] !== value) throw new Error("Executor returned a mismatched shard");
    }
    if (result.kernel !== KERNEL || result.checksum !== expected || result.operations !== shard.count * 2 ||
        typeof result.invocation !== "string" || !result.invocation) {
      throw new Error("Executor returned an unverifiable result");
    }
    return { ...shard, bank, global_offset, checksum: result.checksum, operations: result.operations, invocation: result.invocation };
  }));
  if (new Set(results.map(shard => shard.invocation)).size !== shards) throw new Error("Duplicate executor invocation");
  const checksum = results.reduce((sum, shard) => sum + shard.checksum, 0);
  if (checksum !== replay(seed, terms).checksum) throw new Error("Combined checksum failed replay");
  const receipt = { run_id, kernel: KERNEL, seed, terms, operations: terms * 2, shard_count: shards,
    bank_count: Math.max(...results.map(shard => shard.bank)) + 1, checksum, checksum_scale: SCALE,
    shards: results, replay_verified: true, comparable_hpl: false, elapsed_ms: Date.now() - started };
  return { receipt, sha256: await sha256(JSON.stringify(receipt)) };
}
