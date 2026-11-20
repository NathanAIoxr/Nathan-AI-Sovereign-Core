import { hash } from "node:crypto";
import { availableParallelism } from "node:os";
import { parseArgs } from "node:util";
import { isMainThread, parentPort, Worker, workerData } from "node:worker_threads";

import { GENESIS, GENESIS_HASH, headerProof } from "./runtime.mjs";

const nonceOffset = 76;
const armCounts = [1, 2, 4, 8];

function scan(header, target, range) {
  const matches = [];
  const step = range.reverse ? -1 : 1;
  const count = range.end - range.start;
  let nonce = range.reverse ? range.end - 1 : range.start;

  for (let i = 0; i < count; i += 1, nonce += step) {
    header.writeUInt32LE(nonce, nonceOffset);
    const digest = hash("sha256", hash("sha256", header, "buffer"), "buffer");
    // Bitcoin compares the double-SHA256 output as a little-endian integer.
    let index = 31;
    while (index >= 0 && digest[index] === target[index]) index -= 1;
    if (index < 0 || digest[index] < target[index]) {
      matches.push({ nonce, hash: digest.reverse().toString("hex") });
    }
  }

  return { index: range.index, count, matches };
}

function makeRanges(start, end) {
  const size = Math.min(4096, Math.ceil((end - start) / 8));
  const ranges = [];
  let low = start;
  let high = end;
  // Take the next range alternately from each end of the same input interval.
  while (low < high) {
    const reverse = ranges.length % 2 === 1;
    const count = Math.min(size, high - low);
    if (reverse) {
      ranges.push({ index: ranges.length, start: high - count, end: high, reverse });
      high -= count;
    } else {
      ranges.push({ index: ranges.length, start: low, end: low + count, reverse });
      low += count;
    }
  }
  return ranges;
}

async function run(arms, ranges, target, nonceCount) {
  const workers = [];
  const matches = [];
  const start = performance.now();
  let next = 0;
  let completed = 0;
  let hashes = 0;

  try {
    await new Promise((resolve, reject) => {
      for (let arm = 0; arm < arms; arm += 1) {
        const worker = new Worker(new URL(import.meta.url), { workerData: { target } });
        workers.push(worker);
        let assigned;
        const dispatch = () => {
          assigned = ranges[next];
          if (assigned) {
            next += 1;
            worker.postMessage(assigned);
          }
        };

        worker.on("error", reject);
        worker.on("exit", code => reject(new Error(`Arm exited early with code ${code}`)));
        worker.on("message", result => {
          if (!assigned || result.index !== assigned.index || result.count !== assigned.end - assigned.start ||
              !Array.isArray(result.matches) || result.matches.some(match => match.nonce < assigned.start || match.nonce >= assigned.end)) {
            reject(new Error("Arm returned an invalid or duplicate range receipt"));
            return;
          }
          hashes += result.count;
          matches.push(...result.matches);
          completed += 1;
          if (completed === ranges.length) resolve();
          else dispatch();
        });
        dispatch();
      }
    });
    const elapsedMs = performance.now() - start;
    if (hashes !== nonceCount) throw new Error("Incomplete nonce coverage");

    const header = Buffer.from(GENESIS, "hex");
    matches.sort((a, b) => a.nonce - b.nonce);
    const uniqueNonces = new Set(matches.map(match => match.nonce));
    if (uniqueNonces.size !== matches.length) throw new Error("Duplicate matching nonce");
    for (const match of matches) {
      header.writeUInt32LE(match.nonce, nonceOffset);
      const proof = await headerProof(header.toString("hex"));
      if (!proof.meetsTarget || proof.hash !== match.hash) {
        throw new Error("Independent proof verification failed");
      }
    }
    return { arms, completedRanges: completed, hashes, elapsedMs, hashesPerSecond: hashes * 1000 / elapsedMs, matches };
  } finally {
    await Promise.all(workers.map(worker => worker.terminate()));
  }
}

function integer(value, from, to, flag) {
  const number = Number(value);
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(number) || number < from || number > to) {
    throw new Error(`${flag} must be an integer from ${from} to ${to}`);
  }
  return number;
}

async function benchmark() {
  const { values } = parseArgs({
    options: {
      nonces: { type: "string", default: "262144" },
      trials: { type: "string", default: "3" },
    },
  });
  const nonceCount = integer(values.nonces, 256, 1048576, "--nonces");
  const trials = integer(values.trials, 1, 7, "--trials");
  const reference = await headerProof(GENESIS);
  if (!reference.isBitcoinGenesis || reference.hash !== GENESIS_HASH) throw new Error("Unexpected genesis fixture");
  const genesisNonce = Buffer.from(GENESIS, "hex").readUInt32LE(nonceOffset);
  const startNonce = genesisNonce - Math.floor(nonceCount / 2);
  const endNonceExclusive = startNonce + nonceCount;
  const ranges = makeRanges(startNonce, endNonceExclusive);
  let coveredThrough = startNonce;
  for (const range of ranges.toSorted((a, b) => a.start - b.start)) {
    if (range.start !== coveredThrough || range.end <= range.start) {
      throw new Error("Nonce ranges overlap or have a gap");
    }
    coveredThrough = range.end;
  }
  if (coveredThrough !== endNonceExclusive) throw new Error("Nonce plan does not cover the fixture");
  const byArm = new Map(armCounts.map(count => [count, []]));
  let expectedMatches;

  for (let trial = 0; trial < trials; trial += 1) {
    for (let index = 0; index < armCounts.length; index += 1) {
      const arms = armCounts[(index + trial) % armCounts.length];
      const sample = await run(arms, ranges, reference.target, nonceCount);
      if (!sample.matches.some(match => match.nonce === genesisNonce && match.hash === GENESIS_HASH)) {
        throw new Error("Known genesis proof was missed");
      }
      const signature = JSON.stringify(sample.matches);
      expectedMatches ??= signature;
      if (signature !== expectedMatches) throw new Error("The arms returned different proof sets");
      byArm.get(arms).push(sample);
    }
  }

  const results = [...byArm].map(([arms, samples]) => {
    const rates = samples.map(sample => sample.hashesPerSecond).sort((a, b) => a - b);
    const median = (rates[Math.floor((rates.length - 1) / 2)] + rates[Math.floor(rates.length / 2)]) / 2;
    return {
      arms, medianHashesPerSecond: Math.round(median), elapsedMs: samples.map(sample => Math.round(sample.elapsedMs)),
      hashesPerTrial: nonceCount, coveragePerTrial: "100%", duplicateNonceAssignments: 0,
    };
  });
  const fastest = results.reduce((best, result) => result.medianHashesPerSecond > best.medianHashesPerSecond ? result : best);
  process.stdout.write(JSON.stringify({
    fixture: "Bitcoin genesis header", target: reference.target, startNonce, endNonceExclusive, trials,
    node: process.version, availableParallelism: availableParallelism(), rangesPerTrial: ranges.length,
    timeScope: "From first worker construction through final range receipt, including dispatch and hashing",
    results, fastestArms: fastest.arms, speedupVsOneArm: Number((fastest.medianHashesPerSecond / results[0].medianHashesPerSecond).toFixed(2)),
    verifiedMatches: JSON.parse(expectedMatches),
  }, null, 2) + "\n");
}

if (isMainThread) {
  await benchmark();
} else {
  const header = Buffer.from(GENESIS, "hex");
  const target = Buffer.from(workerData.target, "hex").reverse();
  parentPort.on("message", range => parentPort.postMessage(scan(header, target, range)));
}
