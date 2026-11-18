import { assets } from "./assets.mjs";

const genesisPrefix = "01000000" + "00".repeat(32) +
  "3ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a" + "29ab5f49ffff001d";
const expectedHash = "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f";
const target = 0xffffn << 208n;

async function hashHeader(header) {
  const first = await crypto.subtle.digest("SHA-256", header);
  const second = await crypto.subtle.digest("SHA-256", first);
  return Array.from(new Uint8Array(second).reverse(), byte => byte.toString(16).padStart(2, "0")).join("");
}

export async function genesisReceipt() {
  const prefix = Uint8Array.from(genesisPrefix.match(/../g), byte => parseInt(byte, 16));
  const header = new Uint8Array(80);
  header.set(prefix);
  const view = new DataView(header.buffer);
  const candidates = [];
  for (let nonce = 2083236891; nonce <= 2083236895; nonce++) {
    view.setUint32(76, nonce, true);
    const hash = await hashHeader(header);
    if (BigInt("0x" + hash) <= target) candidates.push({ nonce, hash, header: header.slice() });
  }
  const reverse = await Promise.all(candidates.map(async candidate => {
    const hash = await hashHeader(candidate.header);
    return { nonce: candidate.nonce, hash, accepted: hash === candidate.hash && BigInt("0x" + hash) <= target };
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

const contentTypes = {
  "index.html": "text/html", "style.css": "text/css", "app.mjs": "text/javascript",
  "engine.mjs": "text/javascript", "registry.json": "application/json"
};
const security = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Content-Security-Policy": "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
};

export default {
  async fetch(request) {
    const path = new URL(request.url).pathname;
    const head = request.method === "HEAD";
    if (request.method !== "GET" && !head) return new Response(null, { status: 405, headers: { Allow: "GET, HEAD" } });
    const send = (value, type, status = 200) => new Response(head ? null : value, {
      status, headers: { ...security, "Content-Type": type + "; charset=utf-8", "Cache-Control": "no-cache" }
    });
    if (path === "/api/genesis") {
      const receipt = await genesisReceipt();
      return send(JSON.stringify(receipt), "application/json", receipt.ok ? 200 : 500);
    }
    if (path === "/healthz") return send(JSON.stringify({ ok: true, rings: JSON.parse(assets["registry.json"]).coins.length }), "application/json");
    const file = path === "/" ? "index.html" : path.slice(1);
    if (!Object.hasOwn(contentTypes, file)) return send("Not found", "text/plain", 404);
    return send(assets[file], contentTypes[file]);
  }
};
