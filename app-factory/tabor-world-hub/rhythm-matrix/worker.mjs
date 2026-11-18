import assets from "./assets.generated.mjs";
import { timeline, branches, docs, pillars, naturalRhythms } from "./catalog.mjs";
import { cycleAt, heartbeat, heartbeatQuote, referenceYear, pitchMultiplier, pulseCount, score } from "./model.mjs";
import { domains, eras, history } from "./history-catalog.mjs";
import { renderHistory } from "./history-page.mjs";
import { githubLink, renderPage } from "./page.mjs";

const security = {
  "X-Content-Type-Options": "nosniff", "Referrer-Policy": "strict-origin-when-cross-origin",
  "Content-Security-Policy": "default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'"
};
const formats = {
  "style.css": "text/css", "history.css": "text/css",
  "app.mjs": "text/javascript", "model.mjs": "text/javascript",
  "history-client.mjs": "text/javascript", "history-lab.mjs": "text/javascript"
};

export default {
  fetch(request, env = {}) {
    const { pathname: path, searchParams } = new URL(request.url);
    const send = (body, type, status = 200, headers = {}) => new Response(request.method === "HEAD" ? null : body, {
      status,
      headers: { ...security, "Content-Type": type + "; charset=utf-8", "Cache-Control": "no-cache", ...headers }
    });
    const json = (data, status) => send(JSON.stringify(data), "application/json", status);
    const revision = env.RHYTHM_GITHUB_SHA ?? null;
    if (!["GET", "HEAD"].includes(request.method)) return send("Method not allowed", "text/plain", 405, { Allow: "GET, HEAD" });
    if (path === "/") return send(renderPage(revision), "text/html");
    if (path === "/history" || path === "/history/") return send(renderHistory(revision), "text/html");
    if (path === "/api/history") return json({ eras, domains, records: history });
    if (path === "/healthz" || path === "/api/receipt") return json({
      ok: true, project: "THE RHYTHM MATRIX", author: "Nathan Tabor", revision,
      github: githubLink(revision), records: timeline.length, pulseCount,
      movementCount: heartbeat.length, rhythmRegisterCount: naturalRhythms.length, historyRecords: history.length
    });
    if (path === "/api/catalog") return json({
      author: "Nathan Tabor", branches, timeline, sources: docs, pillars, naturalRhythms,
      musicalScore: { pulseCount, phrases: score },
      movement: { quote: heartbeatQuote, sequence: heartbeat }, pitchMultiplier
    });
    if (path === "/api/cycles") {
      const raw = searchParams.get("year") ?? String(referenceYear);
      if (!/^-?\d{1,5}$/.test(raw)) return json({ error: "Enter a whole year from −10000 to 10000." }, 400);
      try { return json(cycleAt(Number(raw))); }
      catch (error) { return json({ error: error.message }, 400); }
    }
    const filename = path.slice(1);
    if (Object.hasOwn(formats, filename)) return send(assets[filename], formats[filename]);
    return json({ error: "Page not found" }, 404);
  }
};
