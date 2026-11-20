import { demoFeedstock, demoJob, refineBatch } from "./refinery.mjs";
import { motto } from "./motto.mjs";

const name = "The Cryptocurrency Pooper by Nathan Tabor";

const headers = {
  "cache-control": "no-store",
  "content-security-policy": "default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'",
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer"
};

const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${name}</title>
<style>
:root{color-scheme:dark;--bg:#131511;--card:#20231b;--ink:#f1eddc;--muted:#c1bead;--line:#434838;--gold:#edc569;--green:#bdd99c;--mono:ui-monospace,monospace}
*{box-sizing:border-box}body{margin:0;background:radial-gradient(ellipse at 95% 0%,#303421 0%,transparent 52%),var(--bg);color:var(--ink);font:16px/1.55 system-ui,sans-serif;min-height:100vh}
main{max-width:1000px;margin:auto;padding:clamp(26px,6vw,72px) clamp(18px,5vw,44px)}header{padding-bottom:32px;border-bottom:1px solid var(--line)}
h1{font:clamp(42px,7vw,84px)/.96 Georgia,serif;letter-spacing:-.055em;max-width:13ch;margin:14px 0 18px;color:var(--gold)}
h2,h3,p{margin:0}h2{font-size:21px}h3{font-size:18px}.byline{color:var(--ink);font-size:18px}.quote{margin-top:16px;color:var(--muted);max-width:50ch}
.stage-label{color:var(--green);font:13px var(--mono)}.grid{margin:24px 0;display:grid;grid-template-columns:1fr 1fr;gap:12px}
.card{background:var(--card);border:1px solid var(--line);padding:21px;border-radius:14px}.card p{color:var(--muted);margin-top:6px}
.metrics{color:var(--green)!important;font-family:var(--mono);font-size:13px;min-height:26px}.settlement{border-top:1px solid var(--line);padding:22px 0}
.result{display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap}.amount{font:700 24px var(--mono);color:var(--gold)}
button{border:0;border-radius:8px;background:var(--gold);color:var(--bg);padding:12px 16px;font:700 15px system-ui;cursor:pointer;margin:16px 0 4px}
button:focus-visible,summary:focus-visible{outline:2px solid var(--green);outline-offset:4px}button[disabled]{opacity:.65}
#status,.note{color:var(--muted);font-size:14px;margin-top:8px}details{margin-top:16px}summary{cursor:pointer;color:var(--green)}
pre{background:#151811;border:1px solid var(--line);border-radius:8px;padding:14px;overflow:auto;font:13px/1.45 var(--mono)}
.motto{margin-top:24px;padding:20px;border:1px solid var(--line);border-radius:14px;background:var(--card)}
.motto h2,.motto a{color:var(--gold)}.motto blockquote{margin:16px 0;max-width:56ch;padding-left:14px;border-left:2px solid var(--gold)}
.motto blockquote p+p{margin-top:10px}.motto .opening{margin-top:8px;color:var(--muted)}
@media(max-width:580px){.grid{grid-template-columns:1fr}.card{padding:15px}}
</style>
<script src="/app.js" defer></script>
</head>
<body>
<main>
<header>
<p class="stage-label">Staging lab · Sample data</p>
<h1>The Cryptocurrency Pooper</h1>
<p class="byline">by Nathan Tabor</p>
<p class="quote">It’s amazing what you can learn from mother nature, and then when you apply creativity and imagination …</p>
</header>
<section class="motto" aria-labelledby="academy-motto">
<h2 id="academy-motto">${motto.title}</h2>
<p class="opening">${motto.opening}</p>
<blockquote>${motto.quote.split("\n\n").map(paragraph => `<p>${paragraph}</p>`).join("")}</blockquote>
<p>${motto.dedication}</p>
<p><a href="${motto.academyUrl}">Tabor Academy</a></p>
</section>
<div class="grid">
<section class="card"><h2>Delftia outer filter</h2><p>Pass valid events through once. Count spam and blocked traffic separately.</p><p class="metrics" id="edge"></p></section>
<section class="card"><h2>Cupriavidus inner refinery</h2><p>Retire expired records and preserve records on hold.</p><p class="metrics" id="archive"></p></section>
</div>
<section class="settlement">
<div class="result"><h2>Candidate reward</h2><p class="amount" id="amount">— POOPER</p></div>
<button id="run" type="button">Run the sample batch</button>
<p id="status" role="status">Wallet settlement runs on a separate local test chain.</p>
<details id="details" hidden><summary>View receipt and measurements</summary><pre id="receipt"></pre></details>
</section>
</main>
</body>
</html>`;

const client = `
const select = id => document.getElementById(id);
select("run").addEventListener("click", async () => {
  const button = select("run");
  const status = select("status");
  button.disabled = true;
  status.textContent = "Refining the sample batch.";
  try {
    const response = await fetch("/api/demo");
    if (!response.ok) throw new Error("Request failed");
    const { receipt, receiptHash } = await response.json();
    select("edge").textContent = receipt.edge.forwarded + " forwarded · " + receipt.edge.duplicates + " duplicates · " + receipt.edge.discarded + " discarded";
    select("archive").textContent = receipt.archive.retired.length + " records retired · " + receipt.archive.reclaimedBytes + " serialized bytes reclaimed";
    select("amount").textContent = receipt.candidateCoins + " POOPER";
    select("receipt").textContent = JSON.stringify({ receiptHash, ...receipt }, null, 2);
    select("details").hidden = false;
    status.textContent = "Receipt calculated. Candidate reward awaits verifier approval and chain settlement.";
  } catch {
    status.textContent = "The batch could not run. Try again.";
  } finally {
    button.disabled = false;
  }
});
`;

export default {
  async fetch(request) {
    if (request.method !== "GET") {
      return new Response("Method not allowed", { status: 405, headers: { ...headers, allow: "GET" } });
    }
    const path = new URL(request.url).pathname;
    if (path === "/") {
      return new Response(page, { headers: { ...headers, "content-type": "text/html; charset=utf-8" } });
    }
    if (path === "/app.js") {
      return new Response(client, { headers: { ...headers, "content-type": "application/javascript; charset=utf-8" } });
    }
    if (path === "/api/motto") {
      return Response.json(motto, { headers });
    }
    if (path === "/api/demo") {
      const { receipt, receiptHash } = await refineBatch(demoJob, demoFeedstock);
      return Response.json({ environment: "staging", settlement: "candidate", receipt, receiptHash }, { headers });
    }
    if (path === "/api/health") {
      return Response.json({ app: name, environment: "staging", mode: "sample", mainnet: false }, { headers });
    }
    return new Response("Not found", { status: 404, headers });
  }
};
