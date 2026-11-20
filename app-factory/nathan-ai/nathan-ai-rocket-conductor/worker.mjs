const repository = "NathanAIoxr/Nathan-AI-Sovereign-Core";
const policyPath = "app-factory/nathan-ai/nathan-ai-rocket-conductor/bitcoin-fleet-policy.json";
export const links = {
  policy: "https://raw.githubusercontent.com/" + repository + "/main/" + policyPath,
  github: "https://github.com/" + repository + "/actions/workflows/nathan-rocket-24x7-monitor.yml",
  cloudflare: "https://unified-operations-cockpit.nathantaboract.workers.dev/tabor-sites/conductor",
  goldenGoose: "https://tabor-bridge.nathantaboract.workers.dev/golden-goose/",
  bitcoin: "https://nathan-ai-mining-lab.nathantaboract.workers.dev/api/bitcoin-mainnet",
};
const lead = "Nathan AI Rocket 🚀";
const bytes = new TextEncoder();
const hex = buffer => Array.from(new Uint8Array(buffer), byte => byte.toString(16).padStart(2, "0")).join("");
const digest = async input => hex(await crypto.subtle.digest("SHA-256", input));
const sha = /^[a-f0-9]{40}$/;

async function fixedGet(fetcher, url, maxBytes = 16384) {
  const response = await fetcher(url, { redirect: "manual", signal: AbortSignal.timeout(5000) });
  if (!response.ok || !response.body) throw new Error("Upstream unavailable");
  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let size = 0;
  let body = "";
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new Error("Upstream response too large");
      }
      body += decoder.decode(value, { stream: true });
    }
    return body + decoder.decode();
  } finally {
    reader.releaseLock();
  }
}

async function githubPolicy(fetcher) {
  const body = await fixedGet(fetcher, links.policy);
  const policy = JSON.parse(body);
  if (policy.lead !== lead || policy.compute?.requireExplicitOwnership !== true ||
      policy.compute?.requirePoolEndpoint !== true || policy.rules?.neverFabricateRewards !== true ||
      !Array.isArray(policy.projects) || !Number.isInteger(policy.compute.super2x?.slots) ||
      !Number.isInteger(policy.compute.hyper?.slots)) throw new Error("Invalid GitHub policy");
  return {
    sha256: await digest(bytes.encode(body)),
    requestedSlots: { super2x: policy.compute.super2x.slots, hyper: policy.compute.hyper.slots },
    projects: policy.projects.map(project => ({ id: project.id, role: project.role })),
  };
}

async function masterConductor(fetcher) {
  const data = JSON.parse(await fixedGet(fetcher, links.cloudflare + "/api/health"));
  if (data.service !== "nathan-ai-conductor" || data.ready !== true || !sha.test(data.release)) {
    throw new Error("Master Conductor readiness not verified");
  }
  return { service: data.service, release: data.release };
}

async function goldenGoose(fetcher) {
  const data = JSON.parse(await fixedGet(fetcher, links.goldenGoose + "api/health"));
  if (data.project !== "modern-day-real-life-golden-goose") throw new Error("Golden Goose identity mismatch");
  return { mode: data.mode, ledgerConfigured: data.ledgerConfigured === true, verifierConfigured: data.verifierConfigured === true };
}

async function bitcoinProof(fetcher) {
  const data = JSON.parse(await fixedGet(fetcher, links.bitcoin));
  if (data.network !== "bitcoin-mainnet" || typeof data.header !== "string" || !/^[a-f0-9]{160}$/.test(data.header)) {
    throw new Error("Invalid Bitcoin header");
  }
  const header = Uint8Array.from(data.header.match(/../g), pair => Number.parseInt(pair, 16));
  const bits = new DataView(header.buffer).getUint32(72, true);
  const exponent = bits >>> 24;
  const coefficient = bits & 0x007fffff;
  if (exponent < 3 || exponent > 32 || !coefficient || (bits & 0x00800000)) throw new Error("Invalid compact target");
  const target = BigInt(coefficient) << BigInt(8 * (exponent - 3));
  const first = await crypto.subtle.digest("SHA-256", header);
  const second = new Uint8Array(await crypto.subtle.digest("SHA-256", first));
  const hash = hex(second.reverse());
  if (hash !== data.blockHash || target > (65535n << 208n) || BigInt("0x" + hash) > target) {
    throw new Error("Bitcoin header did not satisfy its target");
  }
  return { blockHash: hash, observedAt: data.observedAt, evidence: "public-header-proof" };
}

async function fleetRegistry(db) {
  const row = await db.prepare(`SELECT
    (SELECT COUNT(*) FROM tabor_compute_fleet) AS registered,
    (SELECT COUNT(*) FROM tabor_compute_heartbeats) AS heartbeats,
    (SELECT COUNT(*) FROM tabor_mining_hardware WHERE status = 'planned') AS plannedHardwareClasses`).first();
  if (!row || !["registered", "heartbeats", "plannedHardwareClasses"].every(key => Number.isInteger(row[key]))) {
    throw new Error("Fleet counts unavailable");
  }
  return row;
}

export async function collect(registry, fetcher = fetch) {
  const tasks = {
    github: githubPolicy(fetcher), cloudflare: masterConductor(fetcher), goldenGoose: goldenGoose(fetcher),
    bitcoin: bitcoinProof(fetcher), fleet: fleetRegistry(registry),
  };
  const checks = await Promise.allSettled(Object.values(tasks));
  const observed = Object.fromEntries(Object.keys(tasks).map((key, index) => {
    const result = checks[index];
    return [key, result.status === "fulfilled" ? { ok: true, ...result.value } : { ok: false }];
  }));
  return {
    conductor: lead,
    observedAt: new Date().toISOString(),
    integrationsReady: checks.every(check => check.status === "fulfilled"),
    mining: {
      state: !observed.fleet.ok ? "registry-unavailable" :
        observed.fleet.registered === 0 ? "awaiting-enrolled-hardware" : "awaiting-pool-verification",
      verified: false,
      poolAcceptedShares: null,
      payoutsVerified: null,
    },
    observed,
  };
}

const e = value => String(value).replace(/[&<>"']/g, char =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const row = (label, check, detail) =>
  `<li><strong>${e(label)}</strong><p>${check.ok ? e(detail) : "Check unavailable"}</p></li>`;

function page(report) {
  const { github, cloudflare, bitcoin, goldenGoose, fleet } = report.observed;
  const count = fleet.ok ? fleet.registered + " registered fleet records · " + fleet.heartbeats + " hardware heartbeats" : "";
  const slots = github.ok ? github.requestedSlots.super2x + " Super 2X slots and " + github.requestedSlots.hyper +
    " Hyper slots in the GitHub policy." : "";
  const state = report.mining.state === "awaiting-enrolled-hardware" ? "Awaiting enrolled mining hardware" :
    report.mining.state === "awaiting-pool-verification" ? "Awaiting verified pool activity" : "Fleet registry unavailable";
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${lead} · Mining Conductor</title><style>
    :root{color-scheme:dark;background:#0b1424;color:#e8f2ff;font:1rem/1.55 system-ui,sans-serif}
    main{max-width:64rem;padding:clamp(1rem,5vw,4rem);margin:auto}h1{font-size:clamp(2.35rem,6vw,4.4rem);line-height:1.08}
    a{color:#89d5fa}nav{display:flex;gap:.6rem 1.3rem;flex-wrap:wrap}ul{list-style:none;padding:0;display:grid;gap:1rem;
    grid-template-columns:repeat(auto-fit,minmax(min(100%,18rem),1fr))}li{border:1px solid #496479;padding:1rem;overflow-wrap:anywhere}
    .status{border-inline-start:4px solid #89d5fa;padding-inline-start:1rem}li p{margin:.5em 0}
  </style><main><h1>${lead}</h1><h2>Cryptocurrency Mining Conductor</h2>
    <p class="status"><strong>${state}</strong><br>${e(count)}<br>${e(slots)}</p>
    <nav><a href="./api/status">Status JSON</a><a href="${links.github}">GitHub monitor</a>
      <a href="${links.cloudflare}">Cloudflare Master Conductor</a><a href="${links.goldenGoose}">Golden Goose</a></nav>
    <ul>${row("GitHub fleet policy", github, github.sha256)}
    ${row("Cloudflare Master Conductor", cloudflare, cloudflare.release)}
    ${row("Bitcoin mainnet header proof", bitcoin, bitcoin.blockHash)}
    ${row("Golden Goose", goldenGoose, goldenGoose.mode)}
    ${row("Cloudflare mining inventory", fleet, count)}</ul>
    <p>Pool shares and payouts have no verified records here. Public block proof measures a block already reported on mainnet.</p>
  </main></html>`;
}

const response = (body, type, status = 200) => new Response(body, {
  status,
  headers: {
    "Content-Type": type + "; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
  },
});

export function accountFetch(env, url, options) {
  if (url === links.bitcoin) {
    return env.MINING_LAB.fetch("https://mining-lab.internal/api/bitcoin-mainnet", options);
  }
  if (url === links.goldenGoose + "api/health") {
    return env.PLATFORM.get("modern-day-real-life-golden-goose").fetch("https://golden-goose.internal/api/health", options);
  }
  if (url === links.cloudflare + "/api/health") {
    return env.PLATFORM.get("nathan-ai-conductor").fetch("https://master-conductor.internal/api/health", options);
  }
  return fetch(url, options);
}

export default {
  async fetch(request, env) {
    if (request.method !== "GET") return new Response("Method not allowed", { status: 405, headers: { Allow: "GET" } });
    const { pathname } = new URL(request.url);
    if (pathname === "/health") return response(JSON.stringify({ conductor: lead, release: env.RELEASE_SHA }), "application/json");
    if (pathname !== "/" && pathname !== "/api/status") return response("Not found", "text/plain", 404);
    const key = new Request(new URL("/rocket-conductor/snapshot-v1", request.url));
    const cache = globalThis.caches?.default;
    const cached = await cache?.match(key).catch(() => undefined);
    const report = cached ? await cached.json() : await collect(env.REGISTRY, (url, options) => accountFetch(env, url, options));
    if (cache && !cached && report.integrationsReady) {
      await cache.put(key, Response.json(report, { headers: { "Cache-Control": "public, max-age=60" } })).catch(() => undefined);
    }
    return pathname === "/api/status" ? response(JSON.stringify(report), "application/json") :
      response(page(report), "text/html");
  },
};
