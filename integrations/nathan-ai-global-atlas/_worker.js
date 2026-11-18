export default {
  async fetch() {
    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="index,follow">
<title>Nathan AI — Global Infrastructure Atlas</title>
<style>
:root{color-scheme:dark;font-family:system-ui,-apple-system,sans-serif;background:#0c1425;color:#edf2fc}
*{box-sizing:border-box}body{margin:0;padding:0}
header{padding:65px max(20px,calc((100vw - 1000px)/2));background:linear-gradient(120deg,#152f56,#0c1425)}
small{letter-spacing:.14em;text-transform:uppercase;color:#93bbff;font-weight:700}
h1{font-size:clamp(2rem,6vw,4.4rem);line-height:1.04;margin:.35em 0}
header p{max-width:710px;color:#c5d3e9;line-height:1.6}
main{max-width:1000px;padding:32px 20px 70px;margin:auto}
h2{font-size:1.5rem}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:12px}
.card{background:#17243a;border:1px solid #37465f;border-radius:12px;padding:18px}
.value{font-size:2rem;font-weight:750}
.label{color:#aabbd0;margin-top:3px;font-size:.85rem}
section{margin-top:38px}
a{color:#9ac1ff}a:hover{color:#fff}
.note{border-left:3px solid #78b4ff;padding:12px 18px;background:#18283e;line-height:1.65}
.links{display:flex;flex-wrap:wrap;gap:12px}
.links a{background:#1c3152;border:1px solid #5278a4;padding:12px 16px;border-radius:8px;text-decoration:none}
footer{color:#a1aec1;border-top:1px solid #344258;margin-top:40px;padding-top:20px}
</style>
</head>
<body><header><small>NATHAN AI 🚀 · VERIFIED RESOURCE ATLAS</small>
<h1>ONE hub. Every component accounted for.</h1>
<p>Infrastructure, fleets, bots, agents and global open-source candidates—each separated into discovered, cataloged, deployed, and health-verified status. No fictional machines or installations.</p>
</header><main>
<h2>Cloudflare account snapshot · Nov 18, 2026</h2>
<div class="grid">
<div class="card"><div class="value">446</div><div class="label">Worker scripts</div></div>
<div class="card"><div class="value">12</div><div class="label">Queues</div></div>
<div class="card"><div class="value">51</div><div class="label">D1 databases</div></div>
<div class="card"><div class="value">6</div><div class="label">R2 buckets</div></div>
<div class="card"><div class="value">17</div><div class="label">Durable Object namespaces</div></div>
<div class="card"><div class="value">10</div><div class="label">KV namespaces</div></div>
<div class="card"><div class="value">1</div><div class="label">Cloudflare Pages project</div></div>
<div class="card"><div class="value">0</div><div class="label">Visible DNS zones</div></div>
</div>
<section><h2>Global open-source discovery</h2>
<p>205 repository references covering AI agents, bot and messaging systems, workflow orchestration, serverless runtimes, kernels, robotics, distributed computing, and web platforms. All 205 are currently cataloged as <strong>discovered_not_installed</strong>.</p>
<div class="links"><a href="https://nathan-ai-comms-bus.nathantaboract.workers.dev/v1/open-source">Browse source inventory (1–50)</a>
<a href="https://nathan-ai-comms-bus.nathantaboract.workers.dev/v1/open-source?offset=50">51–100</a>
<a href="https://nathan-ai-comms-bus.nathantaboract.workers.dev/v1/open-source?offset=100">101–150</a>
<a href="https://nathan-ai-comms-bus.nathantaboract.workers.dev/v1/open-source?offset=150">151–200</a>
<a href="https://nathan-ai-comms-bus.nathantaboract.workers.dev/v1/open-source?offset=200">201–205</a></div>
</section>
<section><h2>Communications & verification</h2>
<div class="links"><a href="https://nathan-ai-comms-bus.nathantaboract.workers.dev/v1/status">Live communications status</a>
<a href="https://nathan-ai-comms-bus.nathantaboract.workers.dev/v1/registry">Live registry summary</a>
<a href="https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core">Source repository</a></div>
</section>
<section><div class="note"><strong>1,000 logical supercomputer slots</strong> exist in the fleet index, not as 1,000 rented or physical compute instances. DNS zones require control of domain names. External open-source projects require license, runtime, and security review before onboarding. The numbers above are a timestamped snapshot; the linked endpoints query production registry data.</div></section>
<footer>By Nathan Tabor and Nathan AI · Built on Cloudflare and GitHub · Preserves original source attribution</footer>
</main></body></html>`;
    return new Response(html, {
      headers: {"content-type":"text/html; charset=utf-8","cache-control":"public,max-age=300"}
    });
  }
};