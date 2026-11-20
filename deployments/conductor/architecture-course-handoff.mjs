const root = "/tabor-sites/conductor";
const project = "tabor-academy-architecture-course";
const pagePath = "/handoffs/" + project;
const apiPath = "/api" + pagePath;
const headers = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
};
const escape = value => String(value).replace(/[&<>"']/g, char =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);

function link(label, href) {
  const url = new URL(href);
  if (url.protocol !== "https:") throw new Error("Invalid handoff link");
  return `<a href="${escape(url.href)}">${escape(label)}</a>`;
}

function page(receipt) {
  const { course } = receipt;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escape(receipt.title)} · Nathan AI Conductor</title>
<style>
:root{color-scheme:dark}body{margin:2rem auto;background:#111d1a;color:#f4eedb;font:1rem/1.6 system-ui;
padding-inline:1rem;max-width:54rem}a{color:#ead197}h1{line-height:1.1}li{margin-block:.35rem}code{overflow-wrap:anywhere}
</style></head><body><main><nav aria-label="Conductor"><a href="${root}">Conductor</a> · <a href="${root}${apiPath}">JSON receipt</a></nav>
<h1>${escape(receipt.title)}</h1>
<p><strong>Received by ${escape(receipt.recipient)}</strong></p>
<p>Academy release <code>${escape(receipt.academyRelease)}</code> · ${link("GitHub source", receipt.source)}</p>
<p>${link("Open the course", course.url)} · ${link("Source ledger worksheet", course.worksheet)} · ${link("Original packet", course.original)} · ${link("Four author prompts", course.prompts)}</p>
<h2>Teaching modules</h2>
<p>${course.tracks.map(escape).join(" · ")}</p>
<ol>${course.modules.map(module => "<li>" + link(module.title, module.url) + "</li>").join("")}</ol>
<h2>Release checks</h2><ul>${receipt.checks.map(item => "<li>" + escape(item) + "</li>").join("")}</ul>
</main></body></html>`;
}

export function serveArchitectureCourseHandoff(request, path, ledger) {
  if (![pagePath, pagePath + "/", apiPath].includes(path)) return null;
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
      WHERE event = 'project_handoff_received' AND event_id LIKE ?
      ORDER BY created_at DESC, event_id DESC LIMIT 1
    `).bind("handoff:" + project + ":%").first();
    if (!row) return respond('{"error":"handoff_not_found"}', "application/json", 404);
    const receipt = JSON.parse(row.details);
    if (receipt.id !== row.event_id || receipt.project !== project || receipt.state !== "received" ||
        !/^[a-f0-9]{40}$/.test(receipt.sourceRevision) ||
        receipt.id !== "handoff:" + project + ":" + receipt.sourceRevision) throw new Error("Invalid receipt");
    return path === apiPath ? respond(row.details, "application/json") : respond(page(receipt), "text/html");
  } catch {
    return respond('{"error":"handoff_temporarily_unavailable"}', "application/json", 503);
  }
}
