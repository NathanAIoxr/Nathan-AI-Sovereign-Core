export const genesisPrefix = "01000000" + "00".repeat(32) +
  "3ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a" + "29ab5f49ffff001d";
export const genesisNonce = 2083236893;
export const genesisHeader = genesisPrefix + "1dac2b7c";
export const expectedHash = "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f";
const mainnetLimit = 0xffffn << 208n;

const proofHex = bytes => Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
const proofBytes = hex => Uint8Array.from(hex.match(/../g), b => parseInt(b, 16));

export async function hashHeader(header) {
  const first = await crypto.subtle.digest("SHA-256", header);
  const second = await crypto.subtle.digest("SHA-256", first);
  return proofHex(new Uint8Array(second).reverse());
}

function decodeCompactTarget(bits) {
  const exponent = bits >>> 24;
  const mantissa = BigInt(bits & 0x007fffff);
  const target = mantissa << BigInt(8 * (exponent - 3));
  if ((bits & 0x00800000) || target === 0n || target > mainnetLimit) return null;
  return target;
}

export async function verifyHeader(headerHex, claimedHash) {
  const base = { algorithm: "SHA-256d", scope: "Bitcoin header proof of work against encoded target and mainnet limit" };
  if (typeof headerHex !== "string" || !/^[0-9a-f]{160}$/i.test(headerHex)) {
    return { ...base, ok: false, error: "header_must_be_80_hex_bytes" };
  }
  if (claimedHash !== undefined && (typeof claimedHash !== "string" || !/^[0-9a-f]{64}$/i.test(claimedHash))) {
    return { ...base, ok: false, error: "claimed_hash_must_be_32_hex_bytes" };
  }
  const header = proofBytes(headerHex);
  const view = new DataView(header.buffer);
  const bits = view.getUint32(72, true);
  const nonce = view.getUint32(76, true);
  const target = decodeCompactTarget(bits);
  const fields = { ...base, headerHex: headerHex.toLowerCase(), nonce, bits: bits.toString(16).padStart(8, "0") };
  if (target === null) return { ...fields, ok: false, error: "invalid_compact_target" };

  const hash = await hashHeader(header);
  const result = { ...fields, hash, target: target.toString(16).padStart(64, "0") };
  if (claimedHash !== undefined && claimedHash.toLowerCase() !== hash) {
    return { ...result, ok: false, error: "claimed_hash_mismatch" };
  }
  return BigInt("0x" + hash) <= target
    ? { ...result, ok: true }
    : { ...result, ok: false, error: "hash_above_target" };
}

export async function genesisReceipt() {
  const header = proofBytes(genesisHeader);
  const view = new DataView(header.buffer);
  const candidates = [];
  for (let nonce = genesisNonce - 2; nonce <= genesisNonce + 2; nonce++) {
    view.setUint32(76, nonce, true);
    const hash = await hashHeader(header);
    if (BigInt("0x" + hash) <= mainnetLimit) {
      candidates.push({ nonce, hash, headerHex: proofHex(header) });
    }
  }
  const reverse = await Promise.all(candidates.map(async candidate => {
    const verified = await verifyHeader(candidate.headerHex, candidate.hash);
    return { nonce: candidate.nonce, hash: verified.hash, accepted: verified.ok };
  }));
  return {
    ok: reverse.length === 1 && reverse[0].accepted && reverse[0].hash === expectedHash,
    algorithm: "SHA-256d",
    scope: "Historical Bitcoin header proof of work",
    forward: { tested: 5, candidates: candidates.length },
    reverse,
    expectedHash
  };
}
