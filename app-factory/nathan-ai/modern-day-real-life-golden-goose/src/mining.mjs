const maxNonce = 0xffffffff;
const maxTarget = (1n << 256n) - 1n;
const headerPattern = /^[0-9a-f]{160}$/i;
const targets = Object.freeze({
  "this-side": "This side of the mirror",
  "as-mirror": "As the mirror",
  "other-side": "The other side of the mirror"
});
const directions = ["forward", "backward", "inverted"];

export const genesisHeader = "01000000" + "00".repeat(32)
  + "3ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a"
  + "29ab5f49ffff001d1dac2b7c";
export const genesisNonce = 2083236893;
export const genesisHash = "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f";

function toBytes(hex) {
  if (typeof hex !== "string" || !headerPattern.test(hex)) throw new TypeError("Expected an 80-byte Bitcoin header");
  return Uint8Array.from(hex.match(/../g), pair => parseInt(pair, 16));
}
function toHex(bytes) {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
}
function setNonce(bytes, nonce) {
  const copy = bytes.slice();
  new DataView(copy.buffer).setUint32(76, nonce, true);
  return copy;
}
function mirrorNonce(bytes, nonce) {
  return Uint8Array.of(...bytes.subarray(0, 76), nonce & 255, nonce >>> 8 & 255, nonce >>> 16 & 255, nonce >>> 24);
}
export function targetFromBits(bits) {
  const exponent = bits >>> 24;
  const coefficient = BigInt(bits & 0x007fffff);
  const shift = BigInt(8 * (exponent - 3));
  const target = shift >= 0n ? coefficient << shift : coefficient >> -shift;
  if (bits & 0x00800000 || target <= 0n || target > maxTarget) throw new TypeError("Invalid compact proof-of-work target");
  return target;
}
async function inspect(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const target = targetFromBits(view.getUint32(72, true));
  const first = await crypto.subtle.digest("SHA-256", bytes);
  const second = await crypto.subtle.digest("SHA-256", first);
  const hash = toHex(new Uint8Array(second).reverse());
  return { hash, target: target.toString(16).padStart(64, "0"), meetsHeaderTarget: BigInt("0x" + hash) <= target };
}

export function verifyHeader(headerHex) {
  return inspect(toBytes(headerHex));
}

export function nonceSequence(side, direction, start, count) {
  if (!Object.hasOwn(targets, side) || !directions.includes(direction)
    || !Number.isSafeInteger(start) || !Number.isSafeInteger(count)
    || start < 0 || count < 1 || count > 64 || start + count - 1 > maxNonce) {
    throw new TypeError("Invalid method or nonce interval");
  }
  const rangeStart = side === "other-side" ? maxNonce - (start + count - 1) : start;
  return Array.from({ length: count }, (_, index) => {
    if (direction === "backward") return rangeStart + count - 1 - index;
    if (direction === "inverted") return maxNonce - (rangeStart + index);
    return rangeStart + index;
  });
}

export async function nineMethodRun({ headerHex, start, count }) {
  const bytes = toBytes(headerHex);
  const hashes = new Map();
  const methods = [];
  for (const [side, label] of Object.entries(targets)) {
    for (const direction of directions) {
      const nonces = nonceSequence(side, direction, start, count);
      const hits = [];
      for (const nonce of nonces) {
        if (!hashes.has(nonce)) hashes.set(nonce, await inspect(setNonce(bytes, nonce)));
        const result = hashes.get(nonce);
        if (side === "as-mirror") {
          const independent = await inspect(mirrorNonce(bytes, nonce));
          if (independent.hash !== result.hash) throw new Error("Mirror reconstructed a different block header");
        }
        if (result.meetsHeaderTarget) hits.push({ nonce, hash: result.hash });
      }
      methods.push({ side, label, direction, nonces, hits, independentSerializationCheck: side === "as-mirror" });
    }
  }
  return { algorithm: "Bitcoin SHA-256d header proof", start, count, uniqueNonces: hashes.size, methods };
}

export function miningDemo() {
  return nineMethodRun({ headerHex: genesisHeader, start: genesisNonce - 3, count: 8 });
}
