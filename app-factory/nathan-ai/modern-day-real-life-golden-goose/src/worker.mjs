import { allocation, biofilm, demo, fleet, project, refine, safeId } from "./engine.mjs";
import { miningDemo } from "./mining.mjs";
import { ledgerTotals, recordClaim, verifyClaim } from "./ledger.mjs";

const title = "The Modern-Day Real-Life Golden Goose by Nathan Tabor";
const security = {
  "cache-control": "no-store",
  "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; script-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'",
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer"
};
const lanes = [
  "Authorized intake", "Delftibactin filter", "CopA archive refinery", "Forward verification",
  "Reverse verification", "Biofilm rollup", "Fleet inventory", "Conductor coordination"
];
function json(data, status = 200) {
  return Response.json(data, { status, headers: security });
}
function asset(content, type) {
  return new Response(content, { headers: { ...security, "content-type": type + "; charset=utf-8" } });
}
const page = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title>
<script src="./lab.js" defer></script>
<style>
:root{color-scheme:dark;--bg:#121710;--ink:#f5efda;--muted:#c1c5b4;--gold:#f0ce73;--line:#495040;--surface:#20271c}*{box-sizing:border-box}
body{margin:0;background:radial-gradient(ellipse at top right,#353a23,transparent 60%),var(--bg);color:var(--ink);font:16px/1.55 system-ui,sans-serif}
main{max-width:1100px;margin:auto;padding:clamp(22px,6vw,64px) clamp(18px,5vw,40px)}header{padding-bottom:30px;border-bottom:1px solid var(--line)}
h1{font:clamp(40px,7.8vw,90px)/.94 Georgia,serif;letter-spacing:-.06em;color:var(--gold);max-width:17ch;margin:13px 0 14px}
h2{font-size:20px;margin:0 0 8px}p{margin:0 0 10px}.muted{color:var(--muted)}.eyebrow,strong{color:var(--gold)}.eyebrow{font:14px ui-monospace,monospace}
.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:22px}
section{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:20px}.wide{grid-column:1/-1}ul{padding-left:19px;margin-bottom:0}
button{margin:6px 0 12px;background:var(--gold);color:var(--bg);border:0;border-radius:8px;padding:12px 16px;font:700 15px system-ui;cursor:pointer}
button[disabled]{opacity:.7}button:focus-visible,summary:focus-visible{outline:2px solid #d6edb9;outline-offset:4px}
pre{font:13px/1.4 ui-monospace,monospace;overflow:auto;background:#151b12;border-radius:8px;padding:12px}summary{cursor:pointer;color:var(--gold)}
@media(max-width:610px){.grid{grid-template-columns:1fr}.wide{grid-column:1}}
</style></head>
<body><main><header><p class="eyebrow">Golden Goose lab</p><h1>The Modern-Day Real-Life Golden Goose</h1><p>by Nathan Tabor</p>
<p class="muted">Eight arms refine an archive, check both sides of the mirror, and roll up the results.</p></header>
<div class="grid"><section><h2>Super 2X fleet</h2><p><strong>1,000</strong> planned mining device slots</p><p class="muted">0 enrolled mining devices</p></section>
<section><h2>Hyper fleet</h2><p><strong>1,000</strong> planned mining device slots</p><p class="muted">0 enrolled mining devices</p></section>
<section><h2>Golden Egg distribution</h2><ul><li>50% Core Reserve Vault</li><li>25% Jet-Siphon Expansion</li><li>15% Node &amp; Arm Operators</li><li>10% Ecosystem &amp; Liquidity</li></ul></section>
<section><h2>Biofilm release threshold</h2><p><strong>1,000 independently verified cleanup units</strong></p><p class="muted">This public lab runs sample data and displays candidate units.</p></section>
<section class="wide"><h2>Run the eight arms</h2><button id="run" type="button">Refine the sample batch</button><p id="result" class="muted" role="status">Waiting for the sample batch.</p>
<details id="details" hidden><summary>View receipt</summary><pre id="receipt"></pre></details></section>
<section class="wide"><h2>Cryptocurrency mining methods</h2><p class="muted">Bitcoin genesis header · bounded proof-of-work replay</p>
<table style="border-collapse:collapse;width:100%;text-align:left"><thead><tr><th scope="col">Mirror position</th><th scope="col">Forward</th><th scope="col">Backward</th><th scope="col">Inverted</th></tr></thead>
<tbody><tr><th scope="row">This side of the mirror</th><td id="this-side-forward">—</td><td id="this-side-backward">—</td><td id="this-side-inverted">—</td></tr>
<tr><th scope="row">As the mirror</th><td id="as-mirror-forward">—</td><td id="as-mirror-backward">—</td><td id="as-mirror-inverted">—</td></tr>
<tr><th scope="row">The other side of the mirror</th><td id="other-side-forward">—</td><td id="other-side-backward">—</td><td id="other-side-inverted">—</td></tr></tbody></table>
<button id="mining" type="button">Run all nine mining methods</button><p id="mining-status" role="status" class="muted"></p>
<details id="mining-details" hidden><summary>View nonce paths and matching hashes</summary><pre id="mining-receipt"></pre></details></section>
</div></main></body></html>`;
const client = `const get = id => document.getElementById(id);
get("run").addEventListener("click", async () => {
  const button = get("run");
  button.disabled = true;
  get("result").textContent = "Running the refinery.";
  try {
    const response = await fetch("./api/demo");
    if (!response.ok) throw new Error("Run failed");
    const body = await response.json();
    const receipt = body.report;
    get("result").textContent = receipt.activeArms + " arms checked " + receipt.retired + " removable archive records, with " + receipt.candidateCleanUnits + " candidate cleanup units.";
    get("receipt").textContent = JSON.stringify(body, null, 2);
    get("details").hidden = false;
  } catch {
    get("result").textContent = "The sample could not run. Try again.";
  } finally {
    button.disabled = false;
  }
});
get("mining").addEventListener("click", async () => {
  const button = get("mining");
  button.disabled = true;
  get("mining-status").textContent = "Checking all nine methods.";
  try {
    const response = await fetch("./api/mining/methods");
    if (!response.ok) throw new Error("Run failed");
    const proof = await response.json();
    for (const method of proof.methods) {
      get(method.side + "-" + method.direction).textContent = method.hits.length + " found";
    }
    get("mining-status").textContent = proof.methods.length + " methods checked across " + proof.uniqueNonces + " distinct nonces.";
    get("mining-receipt").textContent = JSON.stringify(proof, null, 2);
    get("mining-details").hidden = false;
  } catch {
    get("mining-status").textContent = "The replay could not run. Try again.";
  } finally {
    button.disabled = false;
  }
});`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (request.method === "GET") {
      if (path === "/") return asset(page, "text/html");
      if (path === "/lab.js") return asset(client, "text/javascript");
      if (path === "/api/health" || path === "/health") {
        return json({ project, environment: env.GOLDEN_GOOSE_ENV ?? "local", mode: "cleanup-lab",
          ledgerConfigured: Boolean(env.GOLDEN_GOOSE_DB), verifierConfigured: Boolean(env.GOLDEN_GOOSE_VERIFIER),
          confirmedMainnetMining: 0 });
      }
      if (path === "/api/mining/methods") return json(await miningDemo());
      if (path === "/api/fleet") return json({ fleet, lanes, maxArmsPerBatch: 8 });
      if (path === "/api/demo") {
        const report = await refine(demo);
        return json({ mode: "sample", payout: "candidate-only", report, sampleRollup: biofilm(report.candidateCleanUnits), allocation });
      }
      if (path === "/api/ledger") {
        const workspace = url.searchParams.get("workspace");
        if (!safeId(workspace)) return json({ error: "Valid workspace required" }, 400);
        if (workspace !== demo.workspace) return json({ error: "Not found" }, 404);
        if (!env.GOLDEN_GOOSE_DB) return json({ error: "Ledger is not configured" }, 503);
        return json({ workspace, ...(await ledgerTotals(env.GOLDEN_GOOSE_DB, workspace)) });
      }
    }
    if (request.method === "POST" && path === "/api/attest") {
      if (!env.GOLDEN_GOOSE_DB || !env.GOLDEN_GOOSE_VERIFIER) return json({ error: "Verifier or ledger is not configured" }, 503);
      if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") return json({ error: "JSON required" }, 415);
      const reader = request.body?.getReader();
      if (!reader) return json({ error: "Claim required" }, 400);
      let claim;
      try {
        const decoder = new TextDecoder("utf-8", { fatal: true });
        let input = "";
        let size = 0;
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > 4096) {
            await reader.cancel();
            return json({ error: "Claim exceeds 4 KiB" }, 413);
          }
          input += decoder.decode(value, { stream: true });
        }
        claim = JSON.parse(input + decoder.decode());
      } catch {
        return json({ error: "Invalid claim" }, 400);
      }
      if (!await verifyClaim(env.GOLDEN_GOOSE_ENV, env.GOLDEN_GOOSE_VERIFIER, claim)) {
        return json({ error: "Invalid verifier signature or claim" }, 401);
      }
      const result = await recordClaim(env.GOLDEN_GOOSE_DB, claim);
      return json(result, result.inserted ? 201 : 409);
    }
    return json({ error: "Not found" }, 404);
  }
};
