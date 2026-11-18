import { design } from "./design.mjs";

const fixture = "reference-v1";
const gates = design.axioms;
const rounds = 4096;

export function verify() {
  const packets = [
    { op: gates[0], signal_value: 1 },
    { op: gates[1], signal_value: 0 },
    { op: gates[0], signal_value: 8, noise: true },
    { op: gates[0], signal_value: 1, note: ["1+1", "10"].join("=") }
  ];
  const clean = packets.filter(packet =>
    !packet.noise && !JSON.stringify(packet).replace(/\s/g, "").includes(["1+1", "10"].join("=")) &&
    gates.includes(packet.op) && !(packet.op === gates[1] && packet.signal_value === 0));
  // Three independently stored copies are a small software redundancy fixture.
  const fields = Array.from({ length: 78 }, (_, i) => i % 2);
  const copies = [fields.slice(), fields.slice(), fields.slice()];
  copies[1][41] ^= 1;
  const recovered = fields.map((_, i) => Number(copies[0][i] + copies[1][i] + copies[2][i] >= 2));
  const start = performance.now();
  let checksum = 0;
  for (let i = 1; i <= rounds; i++) checksum += i * 0.5 + 0.25;
  const elapsedMs = performance.now() - start;
  return {
    ok: 1 + 1 === 2 && 1 - 1 === 0 && clean.length === 1 && recovered.every((v, i) => v === fields[i]),
    axioms: gates,
    slayer: { submitted: packets.length, removed: packets.length - clean.length },
    sleyer: { retained: clean.length, woven: clean.reduce((total, packet) => total + packet.signal_value, 0) },
    redundancyFixture: { fields: fields.length, injectedFlips: 1, restored: recovered.every((v, i) => v === fields[i]) },
    topology: {
      logicalSlots: Array.from({length: 10}, (_, node) => ({node: node + 1, circuits: Array.from({length: 32}, (_, i) => i + 1)})),
      axes: Array.from({length: 33}, (_, i) => ({level: i + 1, directions: ["forward", "reverse"]}))
    },
    workload: { label: "Worker scalar arithmetic smoke test", rounds, expressionOperations: rounds * 3, elapsedMs: elapsedMs > 0 ? elapsedMs : null, checksum },
    hplMeasurement: null
  };
}

async function receipt(db, write) {
  const query = db.prepare("SELECT created_at, receipt FROM sovereign_2x_receipts WHERE fixture = ?").bind(fixture);
  let row = await query.first();
  if (write && !row) {
    const result = verify();
    if (!result.ok) throw new Error("Reference verification failed");
    await db.prepare("INSERT INTO sovereign_2x_receipts VALUES (?, ?, ?) ON CONFLICT(fixture) DO NOTHING")
      .bind(fixture, new Date().toISOString(), JSON.stringify(result)).run();
    row = await query.first();
  }
  return row ? { fixture, createdAt: row.created_at, result: JSON.parse(row.receipt) } : null;
}

const publicChecks = [
  ["Super Computer", "https://nathan-tabor-supercomputer.nathantaboract.workers.dev/healthz",
    data => data.ok === true],
  ["Sovereign Coin Catalog", "https://tabor-sovereign-currency.nathantaboract.workers.dev/api/coins",
    data => Array.isArray(data.authored) && data.authored.length >= 61 &&
      ["SIN", "SEN"].every(ticker => data.authored.some(coin => coin.name.startsWith(ticker + " · ")))],
  ["Edge Switchboard", "https://tabor-sovereign-currency.nathantaboract.workers.dev/api/quantum/receipt",
    data => data.result?.gates?.length === 4 && data.result.backwardScan?.nonce === 2083236893],
  ["Tabor World Hub", "https://tabor-world.nathantaboract.workers.dev/api/destinations",
    data => Array.isArray(data) && data.some(item => item.id === "supercomputer-2x" &&
      item.url === "https://nathan-tabor-supercomputer-2x.nathantaboract.workers.dev/")]
];

async function collectChecks(fetcher) {
  const local = verify();
  const checks = [{ name: "2X+ reference verification", passed: local.ok }];
  checks.push(...await Promise.all(publicChecks.map(async ([name, url, validate]) => {
    try {
      const response = await fetcher(url);
      if (!response.ok) return { name, passed: false, detail: "HTTP " + response.status };
      const passed = Boolean(validate(await response.json()));
      return { name, passed, ...(passed ? {} : { detail: "Unexpected response data" }) };
    } catch {
      return { name, passed: false, detail: "Request failed or timed out" };
    }
  })));
  return checks;
}

function boundFetcher(env) {
  const services = {
    "nathan-tabor-supercomputer.nathantaboract.workers.dev": env.CORE,
    "tabor-sovereign-currency.nathantaboract.workers.dev": env.CURRENCY,
    "tabor-world.nathantaboract.workers.dev": env.HUB
  };
  return url => services[new URL(url).hostname].fetch(new Request(url));
}

export async function runOperations(db, scheduledMs, fetcher = fetch) {
  const checks = await collectChecks(fetcher);
  const passed = checks.every(check => check.passed);
  await db.batch([
    db.prepare("INSERT INTO sovereign_operations_runs VALUES (?, ?, ?, ?) ON CONFLICT(scheduled_ms) DO NOTHING")
      .bind(scheduledMs, new Date().toISOString(), Number(passed), JSON.stringify(checks)),
    db.prepare("DELETE FROM sovereign_operations_runs WHERE scheduled_ms < ?")
      .bind(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ]);
}

async function recentOperations(db) {
  const { results } = await db.prepare("SELECT scheduled_ms, completed_at, passed, checks FROM sovereign_operations_runs ORDER BY scheduled_ms DESC LIMIT 24").all();
  return { cadenceMinutes: 5, retentionDays: 7, runs: results.map(row => ({
    scheduledAt: new Date(row.scheduled_ms).toISOString(), completedAt: row.completed_at,
    passed: Boolean(row.passed), checks: JSON.parse(row.checks)
  })) };
}

function page() {
  const targets = design.targets.map(t => '<tr><th scope="row">' + t.name + '</th><td>' + t.baseline +
    '</td><td>' + t.target + '</td><td>' + t.unit + '</td><td>' + t.baselineType + '</td><td>' + t.fusion.join(', ') + '</td></tr>').join('');
  const stack = Object.entries(design.stack).map(([name, items]) =>
    '<section><h3>' + name.replaceAll('_',' ') + '</h3><ul>' + items.map(x => '<li>' + x + '</li>').join('') + '</ul></section>').join('');
  return '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + design.name +
    '</title><style>body{max-width:78rem;margin:2rem auto;padding:0 1.25rem;background:#101824;color:#edf4ff;font:1rem/1.6 system-ui}a{color:#9de4ff}nav{display:flex;gap:1rem;flex-wrap:wrap}h1{font-size:clamp(1.8rem,5vw,3.5rem);line-height:1.15}.table{overflow:auto}table{width:100%;border-collapse:collapse}th,td{padding:.7rem;text-align:left;border-bottom:1px solid #546578}button{font:inherit;padding:.6rem 1rem}.stack{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,20rem),1fr));gap:1.25rem}li{overflow-wrap:anywhere}</style><main><nav><a href="https://tabor-world.nathantaboract.workers.dev/">Tabor World Hub</a><a href="https://nathan-tabor-supercomputer.nathantaboract.workers.dev/">Original Super Computer</a><a href="https://tabor-sovereign-currency.nathantaboract.workers.dev/switchboard">Edge Switchboard</a><a href="/api/design">Design JSON</a><a href="/true-cloud">True Cloud Computing</a><a href="/api/operations">Scheduled verification receipts</a></nav><h1>' +
    design.name + '</h1><p>1 + 1 = 2 · 1 − 1 = 0</p><p>Designed by Nathan Tabor. The 2X+ architecture brings together the 320-slot Global Grid, 4T Clover, vSoC, and the 33-level forward and reverse routing design.</p><h2>Nathan AI architecture</h2><div class="stack">' + stack + '</div><h2>2X+ compute targets</h2><div class="table"><table><thead><tr><th>System</th><th>Baseline</th><th>2× target</th><th>Unit</th><th>Baseline type</th><th>Architecture</th></tr></thead><tbody>' +
    targets + '</tbody></table></div><p>LineShine and El Capitan baselines are published HPL results. The Sovereign Supercomputer’s 2× figures are design targets. Its Cloudflare runtime reports no HPL result. <a href="' + design.benchmarkSource + '">TOP500 HPL source</a></p><h2>Live verification</h2><p>The Worker runs the Slayer/Sleyer filter and a 78-field bit-flip fixture. The software topology models 320 slots across 10 nodes and 66 directional axes across 33 levels.</p><form action="/api/receipt" method="post"><button>Run and save reference receipt</button></form><p><a href="/api/receipt">Read saved receipt</a> · <a href="/api/verify">Run without saving</a></p></main></html>';
}

function trueCloudPage() {
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>True Cloud Computing by Nathan Tabor</title>
<style>body{margin:0;background:#0e1928;color:#eff6ff;font:1rem/1.65 system-ui}main{max-width:64rem;margin:3rem auto;padding:0 1.3rem 3rem}nav{display:flex;flex-wrap:wrap;gap:1rem}h1{font-size:clamp(2.2rem,7vw,4.8rem);line-height:1.05;margin-bottom:.4em}a{color:#a8ddff}dl{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,16rem),1fr));gap:1rem}dl div{background:#17283b;border:1px solid #40556e;padding:1rem;border-radius:.65rem}dt{font-weight:700}dd{margin:0}.lead{max-width:45rem;font-size:1.25rem}</style>
<main><nav><a href="/">2X+ Sovereign Supercomputer</a><a href="https://tabor-world.nathantaboract.workers.dev/">Tabor World Hub</a><a href="https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/pull/317">GitHub source</a></nav>
<h1>True Cloud Computing by Nathan Tabor</h1>
<p class="lead">I will have True cloud computing so can you</p>
<p>The cloud runs on physical machines. Here, GitHub holds the code and Cloudflare operates the infrastructure where it runs. You can use the Supercomputer’s Cloudflare interface and view its scheduled work from a browser.</p>
<h2>Follow a live run</h2>
<ol><li><a href="/api/verify">Run the Worker verification</a> to see the Slayer/Sleyer filter and bit-flip fixture execute.</li>
<li><a href="/api/operations">Read the D1 run history</a> to see what the five-minute Cron schedule checked, even with no browser open.</li>
<li><a href="https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/blob/codex/sovereign-supercomputer-2x/supercomputer/2x/wrangler.toml">Read the deployment configuration</a> to see how D1, Cron, and service bindings connect to the Worker.</li></ol>
<h2>What you manage</h2><dl>
<div><dt>IaaS</dt><dd>Rent virtual machines, storage, or networking. You generally manage the operating system and application.</dd></div>
<div><dt>PaaS</dt><dd>Deploy application code to a managed runtime. Cloudflare Workers is the managed runtime for this deployment.</dd></div>
<div><dt>SaaS</dt><dd>Use a finished application through a browser or an app. The provider operates the application for you.</dd></div></dl>
<h2>Where it runs</h2>
<p>Public clouds share provider infrastructure across customers. Private clouds dedicate infrastructure to one organization. Hybrid setups combine environments. Edge computing runs selected workloads closer to users. This deployment uses Cloudflare’s managed Worker runtime and D1 database.</p>
<h2>How changes go live</h2>
<p>The GitHub branch contains the source, Wrangler configuration and workflow. Automated Git-to-Cloudflare deployment requires a configured Workers Builds connection or credentials for the GitHub Actions workflow. This page was deployed directly to Cloudflare.</p></main></html>`;
}

const headers = { "X-Content-Type-Options": "nosniff", "Cache-Control": "no-store",
  "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'" };

export default {
  async scheduled(controller, env) {
    await runOperations(env.DB, controller.scheduledTime, boundFetcher(env));
  },
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    const head = request.method === "HEAD";
    const allowed = path === "/api/receipt" ? ["GET", "HEAD", "POST"] : ["GET", "HEAD"];
    if (!allowed.includes(request.method)) return new Response(null, { status: 405, headers: { Allow: allowed.join(", ") } });
    const json = (data, status = 200) => new Response(head ? null : JSON.stringify(data), {
      status, headers: { ...headers, "Content-Type": "application/json; charset=utf-8" }
    });
    switch (path) {
      case "/": return new Response(head ? null : page(), { headers: { ...headers, "Content-Type": "text/html; charset=utf-8" } });
      case "/true-cloud": return new Response(head ? null : trueCloudPage(), { headers: { ...headers, "Content-Type": "text/html; charset=utf-8" } });
      case "/healthz": return json({ ok: true, service: design.name });
      case "/api/operations/check": return json({ checks: await collectChecks(boundFetcher(env)) });
      case "/api/operations":
        try { return json(await recentOperations(env.DB)); }
        catch { return json({ error: "Operations receipts unavailable" }, 503); }
      case "/api/design": return json(design);
      case "/api/verify": return json(verify());
      case "/api/receipt": {
        try {
          const r = await receipt(env.DB, request.method === "POST");
          return r ? json(r) : json({ error: "Run the fixture to create a receipt" }, 404);
        } catch {
          return json({ error: "Receipt unavailable" }, 503);
        }
      }
      default: return json({ error: "Not found" }, 404);
    }
  }
};
