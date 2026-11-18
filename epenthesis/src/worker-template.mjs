const escape = value => String(value).replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
})[char]);

export function transform(raw, next) {
  const word = raw.trim();
  const following = next.trim();
  const open = DATA.endings.some(ending => word.toLowerCase().endsWith(ending));
  const vowel = DATA.starts.some(start => following.toLowerCase().startsWith(start));
  return {
    raw: word,
    paragogic_s: word.toLowerCase().endsWith("s") ? word : word + "s",
    intrusive_r_bridge: word + (open && vowel ? "-r-" : " ") + following
  };
}

function page(next) {
  const axes = Object.entries(DATA.matrix).map(([key, spec]) => {
    const rows = spec.nodes.map(node => {
      const entry = transform(node, next);
      return "<tr><th>" + escape(entry.raw) + "</th><td>" + escape(entry.paragogic_s) +
        "</td><td>" + escape(entry.intrusive_r_bridge) + "</td></tr>";
    }).join("");
    return "<section><h2>" + escape(key) + " · " + escape(spec.agent) + "</h2><p>" +
      escape(spec.orientation) + " · " + escape(spec.theme) +
      "</p><table><thead><tr><th>Node</th><th>S form</th><th>Bridge</th></tr></thead><tbody>" +
      rows + '</tbody></table><p><a href="/api/matrix?axis=' + encodeURIComponent(key) + '&amp;next=' +
      encodeURIComponent(next) + '">Axis JSON</a></p></section>';
  }).join("");
  const cadence = Object.entries(DATA.cadence).map(([name, entries]) =>
    "<h3>" + escape(name) + "</h3><ul>" + entries.map(item => "<li>" + escape(item) + "</li>").join("") + "</ul>").join("");
  const rules = Object.entries(DATA.rules).map(([name, rule]) =>
    "<h3>" + escape(name) + "</h3><p>" + escape(rule.branch + " · " + rule.mechanism + " · " + rule.function) + "</p>").join("");
  return '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>Nathan Tabor Wordplay Matrix</title><style>body{max-width:70rem;margin:2rem auto;padding:0 1rem;background:#101927;color:#eef5fa;font:1rem/1.6 system-ui}a{color:#a9dcff}table{border-collapse:collapse;width:100%}th,td{text-align:left;padding:.4rem;border-bottom:1px solid #43536b;overflow-wrap:anywhere}section{margin-block:1.6rem}input,button{font:inherit;padding:.3rem}</style>' +
    '<main><nav><a href="https://tabor-world.nathantaboract.workers.dev/">Tabor World</a> · <a href="/api/cadence">Cadence JSON</a></nav><h1>Nathan Tabor Wordplay Matrix</h1>' +
    '<form><label>Next token <input name="next" maxlength="120" value="' + escape(next) + '"></label> <button>Apply to all axes</button></form>' +
    axes + '<h2>Linguistic Epenthesis Engine</h2><p>The live exercise uses spelling-based authoring rules. Intrusive R and paragoge in speech vary by dialect and pronunciation. The bridge is a wordplay model for routing.</p>' + rules +
    '<h2>Music, rhythm and cadence inventory</h2><p>Project notes from the supplied inventory.</p>' + cadence + '</main></html>';
}

const headers = { "X-Content-Type-Options": "nosniff", "Content-Security-Policy":
  "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'" };

export default {
  async fetch(request, env = {}) {
    const url = new URL(request.url);
    const head = request.method === "HEAD";
    const send = (data, status = 200, html = false) => new Response(head ? null : html ? data : JSON.stringify(data), {
      status, headers: {...headers, "Content-Type": html ? "text/html; charset=utf-8" : "application/json; charset=utf-8"}
    });
    if (!head && request.method !== "GET") return new Response(null, { status: 405, headers: {...headers, Allow:"GET, HEAD"} });
    const axis = url.searchParams.get("axis") || "W_axis";
    const next = url.searchParams.get("next") || "is";
    if (next.length > 120) return send({ error: "Next token exceeds 120 characters." }, 400);
    if (url.pathname === "/api/cadence") return send(DATA.cadence);
    if (url.pathname === "/" && !url.searchParams.has("axis")) return send(page(next), 200, true);
    if (url.pathname !== "/" && url.pathname !== "/api/matrix") return send({error:"Not found"},404);
    if (!Object.hasOwn(DATA.matrix, axis)) return send({error:"Unknown axis", axes:Object.keys(DATA.matrix), rules:DATA.rules},400);
    const spec = DATA.matrix[axis];
    return send({ axiom: env.SYSTEM_AXIOM || "ZERO_COINCIDENCES", axis, agent: spec.agent,
      orientation: spec.orientation, theme: spec.theme, nodes: spec.nodes.map(node => transform(node, next)),
      linguistic_engine: DATA.rules });
  }
};
