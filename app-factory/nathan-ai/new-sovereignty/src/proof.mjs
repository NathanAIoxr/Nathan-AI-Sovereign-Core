export const genesis = Object.freeze({
  header: "01000000" + "00".repeat(32) +
    "3ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a" +
    "29ab5f49ffff001d1dac2b7c",
  hash: "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f"
});

export function hex(bytes) {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
}

export async function digest(bytes) {
  return hex(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)));
}

export async function verifyGenesis(header = genesis.header) {
  if (typeof header !== "string" || !/^[a-f0-9]{160}$/i.test(header)) throw new TypeError("Expected an 80-byte header");
  const bytes = Uint8Array.from(header.match(/../g), pair => Number.parseInt(pair, 16));
  const view = new DataView(bytes.buffer);
  const targetBits = view.getUint32(72, true);
  const magnitude = BigInt(targetBits & 0x7fffff);
  const exponent = 8 * ((targetBits >>> 24) - 3);
  const targetNumber = exponent >= 0 ? magnitude << BigInt(exponent) : magnitude >> BigInt(-exponent);
  if ((targetBits & 0x800000) || targetNumber <= 0n || targetNumber >= (1n << 256n)) throw new TypeError("Invalid target");
  const inner = await crypto.subtle.digest("SHA-256", bytes);
  const hash = hex(new Uint8Array(await crypto.subtle.digest("SHA-256", inner)).reverse());
  const target = targetNumber.toString(16).padStart(64, "0");
  return {
    header: header.toLowerCase(), nonce: view.getUint32(76, true), compactBits: targetBits.toString(16).padStart(8, "0"),
    hash, target, meetsTarget: BigInt("0x" + hash) <= targetNumber, matchesGoldenGooseEvidence: hash === genesis.hash
  };
}
