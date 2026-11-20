const encoder = new TextEncoder();
const idPattern = /^[a-z0-9][a-z0-9._-]{0,63}$/;
const eligible = new Set(["mempool_dust", "orphaned_state"]);
const lanes = new Set([...eligible, "spam_flood", "reverse_nonce"]);
export const project = "modern-day-real-life-golden-goose";
export const threshold = 1000;
export const allocation = Object.freeze({ coreReserve: 50, jetSiphonExpansion: 25, nodeArmOperators: 15, ecosystemLiquidity: 10 });
export const fleet = Object.freeze({ super2X: { planned: 1000, enrolledMiningDevices: 0 }, hyper: { planned: 1000, enrolledMiningDevices: 0 } });

export function safeId(value) {
  return typeof value === "string" && idPattern.test(value);
}

export async function hash(value) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(JSON.stringify(value)));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

function readPacket(packet) {
  if (!safeId(packet?.id) || !lanes.has(packet.source) || typeof packet.rawEntropy !== "string"
    || encoder.encode(packet.rawEntropy).length > 2048 || typeof packet.retire !== "boolean") {
    throw new TypeError("Invalid packet");
  }
  return { id: packet.id, source: packet.source, rawEntropy: packet.rawEntropy, retire: packet.retire };
}

async function gzipSize(body) {
  const stream = new Blob([body]).stream().pipeThrough(new CompressionStream("gzip"));
  return (await new Response(stream).arrayBuffer()).byteLength;
}

export async function refine(input, options = {}) {
  const { maxArms = 8 } = options;
  if (!safeId(input?.workspace) || !safeId(input.window) || !Array.isArray(input.packets)
    || input.packets.length > 512 || !Number.isSafeInteger(maxArms) || maxArms < 1 || maxArms > 8) {
    throw new TypeError("Invalid workspace, window, batch, or arm limit");
  }
  const items = new Map();
  let duplicates = 0;
  let discardedTraffic = 0;
  for (const raw of input.packets) {
    const packet = readPacket(raw);
    if (packet.source === "spam_flood") {
      discardedTraffic++;
      continue;
    }
    const existing = items.get(packet.id);
    if (existing) {
      if (JSON.stringify(existing) !== JSON.stringify(packet)) throw new TypeError("Conflicting packet identities");
      duplicates++;
      continue;
    }
    items.set(packet.id, packet);
  }
  const canonical = [...items.values()].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const activeArms = Math.min(maxArms, Math.ceil(canonical.length / 25));
  const chunks = Array.from({ length: activeArms }, () => []);
  canonical.forEach((packet, index) => chunks[index % activeArms].push(packet));
  const arms = await Promise.all(chunks.map(async (packets, id) => {
    const results = await Promise.all(packets.map(async packet => ({
      id: packet.id,
      retired: packet.retire && eligible.has(packet.source),
      digest: await hash(packet)
    })));
    return { arm: id + 1, inspected: results.length, retired: results.filter(result => result.retired).length, results };
  }));
  const resultById = new Map(arms.flatMap(arm => arm.results).map(result => [result.id, result]));
  const forward = canonical.map(packet => resultById.get(packet.id));
  const reverse = [];
  for (const packet of canonical.toReversed()) {
    reverse.push({ id: packet.id, retired: packet.retire && eligible.has(packet.source), digest: await hash(packet) });
  }
  reverse.reverse();
  const [forwardDigest, reverseDigest] = await Promise.all([hash(forward), hash(reverse)]);
  if (forwardDigest !== reverseDigest) throw new Error("Mirror verification failed");

  const retained = canonical.filter(packet => !resultById.get(packet.id).retired);
  const before = encoder.encode(JSON.stringify(canonical)).length;
  const after = encoder.encode(JSON.stringify(retained)).length;
  const compressed = await gzipSize(JSON.stringify(retained));
  const ratio = Number((after / compressed).toFixed(2));
  const report = {
    version: 1,
    jobKey: await hash([project, input.workspace, input.window]),
    workspace: input.workspace, window: input.window, activeArms,
    arms: arms.map(({ arm, inspected, retired }) => ({ arm, inspected, retired })),
    duplicates, discardedTraffic, retired: canonical.length - retained.length,
    serializedBytesBefore: before, serializedBytesAfter: after, gzipBytes: compressed, gzipRatio: ratio,
    candidateCleanUnits: Math.floor((before - after) / 1024),
    forwardDigest, reverseDigest,
    simulatedSuctionVelocity: Number((activeArms * Math.log2(ratio + 1)).toFixed(2))
  };
  return { ...report, receiptHash: await hash(report) };
}

export function biofilm(cleanUnits) {
  if (!Number.isSafeInteger(cleanUnits) || cleanUnits < 0) throw new TypeError("Invalid cleanup units");
  const bundles = Math.floor(cleanUnits / threshold);
  return {
    cleanUnits, threshold, bundles, unitsCarried: cleanUnits % threshold,
    allocation: Object.fromEntries(Object.entries(allocation).map(([bucket, share]) => [bucket, share * bundles]))
  };
}

export const demo = {
  workspace: "golden-goose-demonstration",
  window: "sample-001",
  packets: [
    ...Array.from({ length: 200 }, (_, i) => ({
      id: "archive-" + i, source: "orphaned_state", retire: i < 160, rawEntropy: "sample ".repeat(210)
    })),
    { id: "traffic-sample", source: "spam_flood", retire: true, rawEntropy: "blocked event example" },
    { id: "nonce-sample", source: "reverse_nonce", retire: true, rawEntropy: "nonce traversal measurement" }
  ]
};
