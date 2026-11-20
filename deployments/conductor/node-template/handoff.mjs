const root = "/tabor-sites/conductor";
const project = "nathan-ai-node-template";
const page = "/handoffs/" + project;
const api = "/api" + page;
const headers = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "Content-Security-Policy": "default-src 'none'; base-uri 'none'; frame-ancestors 'none'",
};
const escape = value => String(value).replace(/[&<>"']/g, char =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);

function link(label, href) {
  const url = new URL(href);
  if (url.protocol !== "https:") throw Error("Invalid handoff link");
  return '<a href="' + escape(url.href) + '">' + escape(label) + '</a>';
}

export function serveNodeTemplateHandoff(request, path, ledger) {
  if (![page, page + "/", api].includes(path)) return null;
  return read(request, path, ledger);
}

async function read(request, path, ledger) {
  if (!["GET", "HEAD"].includes(request.method)) {
    return new Response(null, { status: 405, headers: { ...headers, Allow: "GET, HEAD" } });
  }
  const respond = (body, type = "application/json", status = 200) => new Response(
    request.method === "HEAD" ? null : body,
    { status, headers: { ...headers, "Content-Type": type + "; charset=utf-8" } },
  );
  try {
    const row = await ledger.prepare("SELECT event_id, details FROM conductor_events " +
      "WHERE event = 'project_handoff_received' AND event_id LIKE ? " +
      "ORDER BY created_at DESC, event_id DESC LIMIT 1").bind("handoff:" + project + ":%").first();
    if (!row) return respond('{"error":"handoff_not_found"}', "application/json", 404);
    const receipt = JSON.parse(row.details);
    if (receipt.id !== row.event_id || receipt.project !== project || receipt.state !== "received" ||
        !/^[0-9a-f]{40}$/.test(receipt.sourceRevision) ||
        receipt.id !== "handoff:" + project + ":" + receipt.sourceRevision) throw Error("Invalid receipt");
    if (path === api) return respond(row.details);
    return respond('<!doctype html><html lang="en"><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width,initial-scale=1"><title>Nathan AI Node Template handoff</title>' +
      '<main><p><a href="' + root + '">Conductor</a> · <a href="' + root + api + '">JSON receipt</a></p>' +
      '<h1>' + escape(receipt.title) + '</h1><blockquote>' + escape(receipt.note) + '</blockquote>' +
      '<p>Received by ' + escape(receipt.recipient) + '.</p><p>' + escape(receipt.followThrough) + '</p>' +
      '<p>' + link("Live node contract", receipt.contract) + ' · ' + link("Health", receipt.health) + ' · ' +
      link("GitHub source", receipt.source) + ' · ' + link("Verification", receipt.verification) + '</p></main>',
      "text/html");
  } catch {
    return respond('{"error":"handoff_temporarily_unavailable"}', "application/json", 503);
  }
}
