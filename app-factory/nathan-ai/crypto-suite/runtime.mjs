export const GENESIS = "01000000" + "00".repeat(32) + "3ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a29ab5f49ffff001d1dac2b7c";
export const GENESIS_HASH = "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f";

export function asHex(bytes) {
  return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
}
export function hexBytes(hex) {
  if (!/^(?:[0-9a-fA-F]{2})+$/.test(hex)) throw new Error("Use an even number of hexadecimal characters.");
  return Uint8Array.from(hex.match(/../g), byte => Number.parseInt(byte, 16));
}
export async function headerProof(header) {
  if (header.length !== 160) throw new Error("Enter exactly 80 bytes of hexadecimal.");
  const bytes = hexBytes(header);
  const view = new DataView(bytes.buffer);
  const bits = view.getUint32(72, true);
  const exponent = bits >>> 24;
  const coefficient = bits & 0x007fffff;
  if (!coefficient || (bits & 0x00800000) || exponent < 3 || exponent > 32) {
    throw new Error("The header contains an unsupported compact target.");
  }
  const target = BigInt(coefficient) << BigInt(8 * (exponent - 3));
  const bitcoinLimit = 0xffffn << 208n;
  if (target > bitcoinLimit) throw new Error("The compact target exceeds the Bitcoin mainnet proof-of-work limit.");
  const first = await crypto.subtle.digest("SHA-256", bytes);
  const second = await crypto.subtle.digest("SHA-256", first);
  const hash = asHex(new Uint8Array(second).reverse());
  return { hash, target: target.toString(16).padStart(64, "0"), meetsTarget: BigInt("0x" + hash) <= target, isBitcoinGenesis: hash === GENESIS_HASH };
}
function escape(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"})[character]);
}
function json(value, status = 200) {
  return send(JSON.stringify(value), "application/json", status);
}
function send(body, contentType, status = 200) {
  return new Response(body, { status, headers: {
    "Content-Type": contentType + "; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "Content-Security-Policy": "default-src 'none'; style-src 'self'; script-src 'self'; connect-src 'self'; form-action 'none'; base-uri 'none'; frame-ancestors 'none'",
  } });
}
const network = "https://tabor-sovereign-currency.nathantaboract.workers.dev";
const serviceOrigin = "https://nathan-ai-dmsp-dit-public.nathantaboract.workers.dev";
const rolesMarkup = () => roles.map(([role, description]) => "<article><h3>"+escape(role)+"</h3><p>"+escape(description)+"</p></article>").join("");
const input = (name, label, type="text", extra="") => '<label>'+label+'<input id="'+name+'" type="'+type+'" '+extra+' required></label>';
const area = (name,label) => '<label>'+label+'<textarea id="'+name+'" required maxlength="12000"></textarea></label>';
const output = id => '<output id="'+id+'" aria-live="polite"></output>';
const number = (id, label) => input(id,label,"number",'min="0" max="1000000000" step="any"');
const field = (id, label, options) => '<label>'+label+'<select id="'+id+'">'+options.map(x=>'<option>'+escape(x)+'</option>').join("")+'</select></label>';
const section = (title, description, body) => '<section><h2>'+title+'</h2><p>'+description+'</p>'+body+'</section>';
const tools = {
  "crypto-64": () => section("The original 64 positions", "Recovered artwork entries and unresolved slots from the original Nathan Tabor registry.",
    '<p><a href="'+network+'/coins/64">Original registry</a> · <a href="/restoration">Restoration archive</a> · <a href="/api/coins/64">Registry JSON</a></p>'+input("search","Filter by slot, ticker, or name","search",'autocomplete="off"')+
    '<p id="coin-status" role="status">Loading registry…</p><div id="coins"></div>'),
  "mining-lab": () => section("Bitcoin header proof", "SHA-256d and compact-target comparison for an 80-byte header. Header proof is one component of Bitcoin block validation.",
    '<p><a href="/api/genesis-proof">Bitcoin genesis verification data</a> · <a href="/api/crypto-mirror">Mining and wallet evidence receipt</a> · <a href="/launch">Production launch readiness</a> · <a href="/golden-goose">Golden Goose · Live Bitcoin verification</a> · <a href="https://nathan-coin-catalog.nathantaboract.workers.dev/registry">Sovereign Coin Registry</a> · <a href="https://nathan-coin-catalog.nathantaboract.workers.dev/registry#hash">SHA-256 / SHA3-512 verifier</a></p><form id="proof">'+area("header","80-byte hexadecimal header")+
    '<div class="actions"><button>Verify proof</button><button type="button" id="genesis">Use genesis header</button></div></form>'+output("proof-result"))+
    section("Electricity estimate", "Enter measured or hypothetical values for your own equipment.",'<form id="energy">'+number("watts","Power in watts")+number("hours","Run hours")+number("rate","Cost per kWh")+'<button>Calculate</button></form>'+output("energy-result")),
  "cryptology": () => section("SHA-256", "This tool computes a SHA-256 digest in your browser.",
    '<form id="hash">'+area("message","Message")+'<button>Compute SHA-256</button></form>'+output("digest"))+
    section("ECDSA P-256 verification", "Verify a SHA-256 ECDSA signature using a public SPKI key and a raw 64-byte r‖s signature in hexadecimal.",
    '<form id="verify">'+area("signed-message","Signed message")+area("public-key","SPKI public key in hexadecimal")+area("signature","Raw signature in hexadecimal")+'<button>Verify signature</button></form><button type="button" id="sample">Run a local example</button>'+output("verify-result"))+
    section("Cryptographic infrastructure", "Cryptology covers cryptography and cryptanalysis. Operational responsibilities include key inventory, custody, rotation, signature verification, and recovery.",
    '<ul><li>Record algorithm, key ID, owner, permitted signer, and rotation date.</li><li>Keep signing keys in dedicated custody infrastructure.</li><li>Archive signed material with its format, digest, and verification result.</li><li>Run key-revocation and restore exercises with test material.</li></ul>'),
  "crypt-operations": () => section("Crypt oracle", "The oracle checks the original coin source and the Mining Lab using fixed service bindings.",
    '<p><a href="/api/oracle/health">Read service observations</a> · <a href="/api/bot/catalog-audit">Catalog audit bot</a> · <a href="/api/agent/review">Operations review agent</a></p><button id="observe" type="button">Check services</button>'+output("oracle-result"))+
    section("Trader paper journal", "Enter hypothetical trades. The journal is stored in this browser.",
    '<form id="trade">'+input("asset","Asset or symbol","text",'maxlength="32"')+field("side","Direction",["Long","Short"])+number("quantity","Quantity")+number("entry","Entry price")+number("exit","Exit price")+number("fees","Total fees")+'<button>Record paper trade</button></form>'+output("trade-result")+'<ol id="trade-rows"></ol><div class="actions"><button id="export-trade" type="button">Export journal</button><button id="clear-trade" type="button">Clear journal</button></div>')+
    section("People and software roles", "Roles for human oversight and bounded software execution.",'<div class="grid">'+rolesMarkup()+'</div>'),
  "crypto-dmsp-dit": () => section("Operations runbook", "Save a local runbook for crypto services, signing, mining, and cryptographic recovery.",
    '<form id="runbook">'+input("service","Service name","text",'maxlength="80"')+field("area","Checklist",["Mining telemetry","Signing infrastructure","Crypt oracle incident","Backup and recovery"])+
    '<fieldset><legend>Evidence collected</legend><label><input type="checkbox" value="Owner identified"> Owner identified</label><label><input type="checkbox" value="Baseline measured"> Baseline measured</label><label><input type="checkbox" value="Failure and rollback rehearsed"> Failure and rollback rehearsed</label></fieldset><button>Download runbook</button></form>'+output("runbook-result")+
    '<p><a href="'+serviceOrigin+'/">Open the existing Nathan AI DMSP / DIT system</a> · <a href="/api/roles">Role registry JSON</a></p>'),
  "cryptozoology": () => section("Field observations", "Use this fieldbook for folklore, reports, field evidence, and species verification.",
    '<form id="fieldbook">'+input("subject","Subject or reported name","text",'maxlength="80"')+field("evidence","Evidence category",["Folklore","Unverified sighting","Documented sample","Independently verified record"])+area("observation","Observations and source details")+'<button>Save observation</button></form>'+output("field-result")+
    '<ol id="field-rows"></ol><div class="actions"><button id="export-field" type="button">Export fieldbook</button><button id="clear-field" type="button">Clear fieldbook</button></div>')+
    section("For cryptozoologists", "Record date, coarse location, source, witness conditions, and possible alternatives. Preserve original evidence and record independent checks when available.",''),
};
function page(id) {
  const [title, author, intro] = editions[id];
  const links = Object.entries(editions).map(([slug,[name]]) => '<a'+(id===slug?' aria-current="page"':'')+' href="'+(id===slug?"/":"https://nathan-ai-"+slug+".nathantaboract.workers.dev/")+'">'+escape(name)+'</a>').join("");
  return '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+escape(title)+'</title><link rel="stylesheet" href="/style.css"><body data-app="'+id+'"><header><div class="wrap"><p>'+escape(author)+'</p><nav aria-label="Apps">'+links+'</nav></div></header><main class="wrap"><div class="hero"><h1>'+escape(title)+'</h1><p>'+escape(intro)+'</p></div>'+tools[id]()+'</main><script type="module" src="/app.js"></script></body></html>';
}
async function sourceRegistry(env) {
  const response = await env.COIN_SOURCE.fetch("https://internal/api/coins/64");
  if (!response.ok) throw new Error("Coin registry unavailable");
  const data = await response.json();
  if (data.requested !== 64 || !Array.isArray(data.slots) || data.slots.length !== 64 ||
      !data.slots.every((row, index) => row.slot === index + 1)) throw new Error("Coin registry shape mismatch");
  return data;
}
function withCoordinates(data) {
  return { ...data, slots: data.slots.map(slot => ({ ...slot, coordinate: (slot.slot - 1).toString(2).padStart(6, "0") })) };
}
function restorationPage(data) {
  const dataRows = withCoordinates(data).slots.map(row => "<tr><td>"+row.slot+"</td><td><code>"+row.coordinate+"</code></td><td>"+escape(row.ticker ?? "—")+"</td><td>"+escape(row.name ?? "Unresolved")+"</td></tr>").join("");
  const partitions = restoration.partitions.map(([key, detail],index) => "<li><code>"+String(index+1).padStart(2,"0")+" "+escape(key)+"</code><p>"+escape(detail)+"</p></li>").join("");
  const references = restoration.provenance.families.map(item=>"<li><strong>"+escape(item.name)+"</strong> · "+escape(item.anchor)+"<p>"+escape(item.note)+"</p></li>").join("");
  return '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>64-Coin Restoration</title><link rel="stylesheet" href="/style.css"><main class="wrap"><div class="hero"><h1>64-Coin Restoration</h1><p><a href="/">Coin registry</a> · <a href="/api/restoration">Download restoration data</a> · <a href="/manuscript.txt">Read the chapter excerpt</a></p></div>'+
    section("Ledger coordinates",escape(restoration.provenance.coordinateRule),'<div class="table-wrap"><table><thead><tr><th>Slot</th><th>Coordinate</th><th>Ticker</th><th>Original name</th></tr></thead><tbody>'+dataRows+'</tbody></table></div>')+
    section("Coin families from the archive","These references preserve names from other projects. Original slot assignments require source evidence.","<ul>"+references+"</ul>")+
    section("Mining provenance","The mining dashboard artwork reads EST. 1993. The available receipt records a 2026 archive import. Historical mining records are pending.","")+
    section("Seven manuscript partitions","The author-supplied scene and its proposed architecture.","<ol>"+partitions+"</ol>")+"</main></html>";
}
async function miningLaunch(env) {
  const audit = { requested: { compute: 1000, higherCapacity: 1000 }, observed: {
    observedOn: "2026-11-18", computePoolLimit: 110, higherCapacityPoolLimit: 110,
    runningContainers: 0, verifiedMiningEndpoints: 0,
  } };
  try {
    const registry = await sourceRegistry(env);
    const recovered = registry.slots.filter(slot=>slot.status==="recovered_from_42_coin_artwork").length;
    const gates = [
      ["network", "Network specification and consensus proof for the intended coin", false],
      ["execution", "Verified compatible mining endpoint and payout destination", false],
      ["capacity", "Fleet capacity and operating budget for the requested scale", false],
    ].map(([id, requirement, verified])=>({id,requirement,verified}));
    return { ready: gates.every(gate=>gate.verified), registry: { orderedSlots: registry.slots.length, recovered, unresolved: registry.slots.length-recovered }, ...audit, gates };
  } catch {
    return { ready: false, registry: null, ...audit, gates: [], error: "Original coin registry unavailable" };
  }
}
function miningLaunchPage(result) {
  const items = result.gates.map(gate=>"<li>"+escape(gate.requirement)+" · "+(gate.verified?"Verified":"Pending")+"</li>").join("");
  return '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mining launch readiness</title><link rel="stylesheet" href="/style.css"><main class="wrap"><div class="hero"><h1>Mining launch readiness</h1><p><a href="/">Mining Lab</a> · <a href="/api/launch-readiness">Readiness JSON</a> · <a href="https://nathan-ai-crypto-dmsp-dit.nathantaboract.workers.dev/">DMSP &amp; DIT</a></p></div>'+
    section("Production status",result.ready?"Verified for launch":"Awaiting launch inputs",result.error?"<p>"+escape(result.error)+"</p>":"<ul>"+items+"</ul>")+
    section("Fleet check", "The Nov 18 account check found two on-demand compute pools with a maximum of 110 containers each.", "<p>Requested: 1,000 compute and 1,000 higher-capacity instances.</p>")+"</main></html>";
}
const miningRegistryRoutes = new Map([
  ["/coins", "/coins/sovereign"],
  ["/coins/summary", "/coins/sovereign/summary"],
  ["/coins/bounties", "/coins/sovereign/bounties"],
  ["/coins/bounties/stats", "/coins/sovereign/bounties/stats"],
  ["/coins/bounties/work", "/coins/sovereign/bounties/work"],
  ["/coins/bounties/intake", "/coins/sovereign/bounties/intake"],
  ["/verify-hash", "/verify-hash"],
]);

const bitcoinExplorer = "https://mempool.space";
const bitcoinMainnetPath = "/api/bitcoin-mainnet";

async function readBitcoinHex(path, length, signal) {
  const response = await fetch(bitcoinExplorer + "/api/" + path, { redirect: "error", signal });
  if (!response.ok || !response.body) throw new Error("Bitcoin source unavailable");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let value = "";
  let size = 0;
  try {
    for (;;) {
      const { done, value: chunk } = await reader.read();
      if (done) break;
      size += chunk.byteLength;
      if (size > length + 8) throw new Error("Bitcoin source response too long");
      value += decoder.decode(chunk, { stream: true });
    }
    value += decoder.decode();
  } finally {
    await reader.cancel();
  }
  const hex = value.trim().toLowerCase();
  if (hex.length !== length || !/^[0-9a-f]+$/.test(hex)) throw new Error("Invalid response from Bitcoin source");
  return hex;
}

async function bitcoinMainnetEvidence(request) {
  const cache = globalThis.caches?.default;
  const cacheKey = new Request(new URL(bitcoinMainnetPath, request.url));
  const cached = await cache?.match(cacheKey).catch(() => undefined);
  if (cached) return cached;

  try {
    const signal = AbortSignal.timeout(6000);
    const hash = await readBitcoinHex("blocks/tip/hash", 64, signal);
    const header = await readBitcoinHex("block/" + hash + "/header", 160, signal);
    const proof = await headerProof(header);
    if (proof.hash !== hash || !proof.meetsTarget) throw new Error("Bitcoin header proof failed");

    const response = json({
      network: "bitcoin-mainnet",
      source: bitcoinExplorer,
      observedAt: new Date().toISOString(),
      blockHash: hash,
      header,
      target: proof.target,
      meetsEmbeddedTarget: true,
      evidence: "provider-reported tip with independently checked header proof of work",
    });
    response.headers.set("Cache-Control", "public, max-age=60");
    await cache?.put(cacheKey, response.clone()).catch(() => undefined);
    return response;
  } catch {
    return json({ network: "bitcoin-mainnet", error: "Live Bitcoin header verification is temporarily unavailable." }, 503);
  }
}

function goldenGoosePage(result) {
  const block = result.blockHash
    ? '<dl><dt>Observed at (UTC)</dt><dd>'+escape(result.observedAt)+'</dd>'+
      '<dt>Bitcoin block hash</dt><dd><a href="'+bitcoinExplorer+'/block/'+escape(result.blockHash)+'">'+escape(result.blockHash)+'</a></dd>'+
      '<dt>Header proof of work</dt><dd>Double SHA-256 reproduced the block hash and met the embedded target.</dd></dl>'
    : '<p role="status">'+escape(result.error)+'</p>';
  return '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
    '<title>The Modern-Day Real-Life Golden Goose by Nathan Tabor</title><link rel="stylesheet" href="/style.css">'+
    '<main class="wrap"><div class="hero"><h1>The Modern-Day Real-Life Golden Goose by Nathan Tabor</h1>'+
    '<p>Nathan AI Rocket 🚀 · Live Bitcoin verification</p>'+
    '<p><a href="/">Mining Lab</a> · <a href="'+bitcoinMainnetPath+'">Verification JSON</a> · <a href="/launch">Mining launch readiness</a></p></div>'+
    section("Bitcoin mainnet", "The conductor checks the current block header reported by Mempool. The hash check covers the header and its embedded target.", block)+
    section("Fleet mining and rewards", "Fleet hashrate, accepted shares, and payouts require telemetry from an enrolled Bitcoin miner and its pool.", "")+
    '</main></html>';
}

export function createApp(id) {
  return { async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (id === "mining-lab" && miningRegistryRoutes.has(path)) {
      try {
        const target = "https://nathan-coin-catalog.nathantaboract.workers.dev" + miningRegistryRoutes.get(path) + url.search;
        return await env.SOVEREIGN_REGISTRY.fetch(new Request(target, request));
      } catch {
        return json({ error: "Sovereign Coin Registry temporarily unavailable" }, 503);
      }
    }
    if (request.method !== "GET") return send("Method not allowed", "text/plain", 405);
    if (path === "/healthz") return json({ app: id, ok: true });
    if (path === "/") return send(page(id), "text/html");
    if (path === "/style.css") return send(":root{--accent:"+editions[id][3]+"}"+styles,"text/css");
    if (path === "/app.js") return send(browserModule, "text/javascript");
    if (path === "/api/coins/64" && id === "crypto-64") {
      try { return json(await sourceRegistry(env)); }
      catch { return json({ error: "Original registry temporarily unavailable" }, 503); }
    }
    if (id === "crypto-64" && path === "/manuscript.txt") return send(restoration.excerpt, "text/plain");
    if (id === "crypto-64" && ["/restoration","/api/restoration"].includes(path)) {
      try {
        const data = await sourceRegistry(env);
        if (path === "/restoration") return send(restorationPage(data), "text/html");
        return json({ ...withCoordinates(data), partitions: restoration.partitions.map(([id,description])=>({id,description})), provenance: restoration.provenance, manuscript: "/manuscript.txt" });
      } catch { return json({ error: "Original registry temporarily unavailable" }, 503); }
    }
    if (id === "mining-lab" && ["/launch","/api/launch-readiness"].includes(path)) {
      const result = await miningLaunch(env);
      return path === "/launch" ? send(miningLaunchPage(result),"text/html") : json(result);
    }
    if (id === "mining-lab" && path === bitcoinMainnetPath) return bitcoinMainnetEvidence(request);
    if (id === "mining-lab" && path === "/golden-goose") {
      const evidence = await bitcoinMainnetEvidence(request);
      return send(goldenGoosePage(await evidence.json()), "text/html", evidence.status);
    }
    if (path === "/api/genesis-proof" && id === "mining-lab") return json({ header: GENESIS, ...(await headerProof(GENESIS)) });
    if (id === "mining-lab" && ["/api/crypto-mirror", "/api/crypto-mirror/state.bin"].includes(path)) {
      return serveCryptoMirror(path, env);
    }
    if (path === "/api/roles" && ["crypt-operations","crypto-dmsp-dit"].includes(id)) return json({ roles });
    if (path === "/api/oracle/health" && id === "crypt-operations") {
      const [coins, mining] = await Promise.allSettled([
        sourceRegistry(env),
        env.MINING_LAB.fetch("https://internal/api/genesis-proof").then(async response => {
          if (!response.ok) throw new Error("Proof endpoint unavailable");
          const proof = await response.json();
          if (!proof.isBitcoinGenesis || !proof.meetsTarget || proof.hash !== GENESIS_HASH) throw new Error("Proof invalid");
          return proof;
        }),
      ]);
      return json({
        observedAt: new Date().toISOString(),
        sources: [
          { source: "Original 64-slot registry", ok: coins.status === "fulfilled", slots: coins.value?.slots.length ?? null },
          { source: "Bitcoin genesis verification", ok: mining.status === "fulfilled", hash: mining.value?.hash ?? null },
        ],
      });
    }
    if (path === "/api/bot/catalog-audit" && id === "crypt-operations") {
      try {
        const data = await sourceRegistry(env);
        const recovered = data.slots.filter(slot => slot.status === "recovered_from_42_coin_artwork");
        const identitiesComplete = recovered.every(slot => typeof slot.name === "string" && slot.name.trim() && typeof slot.ticker === "string" && slot.ticker.trim());
        const open = data.slots.filter(slot => slot.status !== "recovered_from_42_coin_artwork");
        const blanksPreserved = open.every(slot => !slot.name && !slot.ticker);
        return json({ ok: identitiesComplete && blanksPreserved && data.recovered === recovered.length,
          orderedSlots: data.slots.length, recovered: recovered.length, unresolved: open.length, blanksPreserved });
      } catch { return json({ error: "Catalog audit unavailable" }, 503); }
    }
    if (path === "/api/agent/review" && id === "crypt-operations") {
      const app = createApp(id);
      const inputs = await Promise.all(["/api/oracle/health", "/api/bot/catalog-audit"].map(async path => {
        const result = await app.fetch(new Request("https://internal"+path), env);
        return result.json();
      }));
      const [oracle, audit] = inputs;
      const followUp = [];
      for (const source of oracle.sources) if (!source.ok) followUp.push("Review unavailable source: "+source.source);
      if (audit.ok !== true) followUp.push("Review catalog audit errors.");
      else if (audit.unresolved) followUp.push("Find original source evidence for "+audit.unresolved+" unresolved coin positions.");
      return json({ reviewedAt: oracle.observedAt, followUp, approval: "Proposals for owner review" });
    }
    return send("Not found", "text/plain", 404);
  } };
}
