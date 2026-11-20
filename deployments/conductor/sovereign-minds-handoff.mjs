const root = "/tabor-sites/conductor";
const routes = new Set(["/handoffs/sovereign-minds", "/handoffs/sovereign-minds/", "/api/handoffs/sovereign-minds"]);
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
  const { directory, minds, lasso, companions } = receipt;
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sovereign Minds handoff · Nathan AI Conductor</title><style>
:root{color-scheme:dark}body{margin:2rem auto;background:#111d1a;color:#f4eedb;font:1rem/1.6 system-ui;
padding-inline:1rem;max-width:54rem}a{color:#ead197}h1{line-height:1.1}li{padding-block:.35rem}code{overflow-wrap:anywhere}
</style><main><p><a href="${root}">Conductor</a> · <a href="${root}/api/handoffs/sovereign-minds">JSON receipt</a></p>
<h1>Sovereign Minds handoff</h1>
<p><strong>Received by ${escape(receipt.recipient)}</strong> · ${directory.records.toLocaleString("en-US")} addressable records</p>
<p>Verified release <code>${escape(receipt.release)}</code></p>
<p>${link("Directory", directory.url)} · ${link("Live worker status", directory.status)} ·
${link("GitHub source", directory.source)} · ${link("Release workflow", directory.workflow)}</p>
<h2>Zero and One</h2><ul>${minds.map(mind => `<li>${link(mind.name, mind.url)} ·
${link("Conductor prompt", mind.prompt)} · <code>${escape(mind.worker)}</code></li>`).join("")}</ul>
<h2>Lasso of Truth</h2><p>${link("Prompts", lasso.prompts)} · ${link("Reviewed evidence", lasso.evidence)} ·
${link("Nathan Tabor’s original instruction", lasso.originalInstruction)} · ${link("Release gate", lasso.releaseGate)}</p>
<h2>Connected work</h2><ul>${companions.map(entry => `<li>${link(entry.name, entry.url)} ·
${link("Live record", entry.status)}</li>`).join("")}</ul>
<h2>Verification</h2><ul>${receipt.checks.map(check => `<li>${escape(check)}</li>`).join("")}</ul>
</main></html>`;
}

export function serveSovereignMindsHandoff(request, path, ledger) {
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
      WHERE event = 'project_handoff_received' AND event_id LIKE 'handoff:sovereign-minds:%'
      ORDER BY created_at DESC, event_id DESC LIMIT 1
    `).first();
    if (!row) return respond(JSON.stringify({ error: "handoff_not_found" }), "application/json", 404);
    const receipt = JSON.parse(row.details);
    if (receipt.id !== row.event_id || receipt.project !== "sovereign-minds" ||
        receipt.state !== "received" || !/^[a-f0-9]{40}$/.test(receipt.release)) throw Error("Invalid receipt");
    return path.startsWith("/api/") ? respond(row.details, "application/json") : respond(page(receipt), "text/html");
  } catch {
    return respond(JSON.stringify({ error: "handoff_temporarily_unavailable" }), "application/json", 503);
  }
}
