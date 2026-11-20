const root = "/tabor-sites/conductor";
const project = "cryptocurrency-mining";
const routes = new Set(["/handoffs/" + project, "/handoffs/" + project + "/", "/api/handoffs/" + project]);
const headers = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
};
const escape = value => String(value).replace(/[&<>"']/g, char =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
function link(label, href) {
  const url = new URL(href);
  if (url.protocol !== "https:") throw Error("Invalid handoff link");
  return `<a href="${escape(url.href)}">${escape(label)}</a>`;
}

function page(receipt) {
  const { mining, proof, work, course } = receipt;
  const state = mining.state === "awaiting-enrolled-hardware" ? "Awaiting enrolled hardware" : mining.state;
  const yesNo = value => value === null ? "Unverified" : value ? "Yes" : "No";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Cryptocurrency Mining handoff · Nathan AI Conductor</title><style>
:root{color-scheme:dark}body{margin:2rem auto;background:#111d1a;color:#f4eedb;font:1rem/1.6 system-ui;
padding-inline:1rem;max-width:54rem}a{color:#ead197}h1{line-height:1.1}li{padding-block:.3rem}code{overflow-wrap:anywhere}
dt{font-weight:700}dd{margin:0 0 .5rem}
</style></head><body><main><nav><a href="${root}">Conductor</a> · <a href="${root}/api/handoffs/cryptocurrency-mining">JSON receipt</a></nav>
<h1>${escape(receipt.title)}</h1>
<p><strong>Received by ${escape(receipt.recipient)}</strong> · Lead ${escape(receipt.lead)}</p>
<p>Fleet snapshot <time datetime="${escape(receipt.verifiedAt)}">${escape(receipt.verifiedAt)}</time></p>
<h2>Mainnet mining</h2>
<dl><dt>Status</dt><dd>${escape(state)}</dd><dt>Enrolled hardware</dt><dd>${escape(mining.registeredHardware)} devices · ${escape(mining.heartbeats)} heartbeats</dd>
<dt>Planned slots</dt><dd>${escape(mining.plannedSlots.super2x)} Super 2X · ${escape(mining.plannedSlots.hyper)} Hyper</dd>
<dt>Pool-accepted shares</dt><dd>${escape(mining.acceptedShares ?? "Unverified")}</dd>
<dt>Verified payouts</dt><dd>${yesNo(mining.payoutsVerified)}</dd></dl>
<p>Public Bitcoin header proof ${proof.passed ? "passed" : "unverified"} · <code>${escape(proof.hash)}</code></p>
<h2>Project inventory</h2><ul>${work.map(item => `<li>${link(item.title, item.url)} · ${escape(item.status)}</li>`).join("")}</ul>
<p>${escape(course.count)} Academy modules · ${course.modules.map(escape).join(", ")}</p>
<h2>Next actions for Rocket</h2><ol>${receipt.next.map(item => `<li>${escape(item)}</li>`).join("")}</ol>
</main></body></html>`;
}

export function serveMiningHandoff(request, path, ledger) {
  if (!routes.has(path)) return null;
  return readReceipt(request, path, ledger);
}

async function readReceipt(request, path, ledger) {
  const head = request.method === "HEAD";
  if (request.method !== "GET" && !head) {
    return new Response(null, { status: 405, headers: { ...headers, Allow: "GET, HEAD" } });
  }
  const respond = (body, type, status = 200) =>
    new Response(head ? null : body, { status, headers: { ...headers, "Content-Type": type + "; charset=utf-8" } });
  try {
    const row = await ledger.prepare(`
      SELECT event_id, details FROM conductor_events
      WHERE event = 'project_handoff_received' AND event_id LIKE 'handoff:cryptocurrency-mining:%'
      ORDER BY created_at DESC, event_id DESC LIMIT 1
    `).first();
    if (!row) return respond(JSON.stringify({ error: "handoff_not_found" }), "application/json", 404);
    const receipt = JSON.parse(row.details);
    if (receipt.id !== row.event_id || receipt.project !== project ||
        receipt.state !== "received" || !/^[a-f0-9]{40}$/.test(receipt.sourceRevision) ||
        receipt.id !== "handoff:" + project + ":" + receipt.sourceRevision) throw Error("Invalid receipt");
    return path.startsWith("/api/") ? respond(row.details, "application/json") : respond(page(receipt), "text/html");
  } catch {
    return respond(JSON.stringify({ error: "handoff_temporarily_unavailable" }), "application/json", 503);
  }
}
