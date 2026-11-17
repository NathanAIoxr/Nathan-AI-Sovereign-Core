import { repairRoute, refreshRepairs, directInternalScan } from "./repair.mjs";

const REPOSITORY = "NathanAIoxr/Nathan-AI-Sovereign-Core";
const GITHUB = "https://api.github.com/repos/" + REPOSITORY + "/issues";
const MAX_PAGES = 10;
const RECEIPT_LIMIT = 24;

export async function collectIssues(read = fetch, token) {
  const issues = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const url = new URL(GITHUB);
    url.search = new URLSearchParams({
      state: "open", sort: "created", direction: "asc", per_page: "100", page: String(page)
    });
    const response = await read(url, {
      headers: { Accept: "application/vnd.github+json", "User-Agent": "NathanAI-Sovereign-Hive", ...(token ? { Authorization: "Bearer " + token } : {}) },
      redirect: "manual",
      signal: AbortSignal.timeout(12000)
    });
    if (!response.ok) throw new Error("GitHub issue listing failed (HTTP " + response.status + ")");
    const data = await response.json();
    if (!Array.isArray(data) || data.length > 100) throw new Error("Unexpected GitHub issue response");
    issues.push(...data.filter((row) => !Object.hasOwn(row, "pull_request")));
    if (!/<[^>]+>;\s*rel="next"/i.test(response.headers.get("Link") || "")) return issues;
  }
  throw new Error("The scan reached its page limit before GitHub reported the final page");
}

export function validateIssues(source) {
  const unique = new Set();
  return source.map((row) => {
    if (!Number.isSafeInteger(row.number) || row.number < 1 || unique.has(row.number) ||
      row.state !== "open" || typeof row.title !== "string" || !Array.isArray(row.labels) ||
      !row.labels.every((label) => typeof label.name === "string")) {
      throw new Error("Invalid or repeated open issue in the GitHub response");
    }
    unique.add(row.number);
    const labels = row.labels.map((label) => label.name).sort();
    return {
      number: row.number, title: row.title, labels,
      helpWanted: labels.some((label) => label.trim().toLowerCase() === "help wanted"),
      url: "https://github.com/" + REPOSITORY + "/issues/" + row.number
    };
  }).sort((a, b) => a.number - b.number);
}

export function buildSnapshot(previous, issues, scheduledMs) {
  const existing = new Set((previous?.issues || []).map((issue) => issue.number));
  const current = new Set(issues.map((issue) => issue.number));
  const added = [...current].filter((number) => !existing.has(number));
  const removed = [...existing].filter((number) => !current.has(number));
  if (existing.size + added.length - removed.length !== issues.length) {
    throw new Error("Issue reconciliation did not balance");
  }
  const receipt = {
    scheduledAt: new Date(scheduledMs).toISOString(),
    completedAt: new Date().toISOString(),
    previousOpen: existing.size,
    addedToOpen: added,
    removedFromOpen: removed,
    totalOpen: issues.length,
    helpWanted: issues.filter((issue) => issue.helpWanted).length
  };
  return {
    repository: REPOSITORY,
    anchors: ["1+1=2", "1-1=0"],
    status: "verified",
    issues,
    receipt,
    recentReceipts: [receipt, ...(previous?.recentReceipts || [])].slice(0, RECEIPT_LIMIT)
  };
}

export async function compareAndStore(db, issues, scheduledMs) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const current = await db.prepare("SELECT observed_ms, snapshot FROM issue_queue WHERE id = 1").first();
    if (current && current.observed_ms >= scheduledMs) return;
    const snapshot = buildSnapshot(current ? JSON.parse(current.snapshot) : null, issues, scheduledMs);
    const value = JSON.stringify(snapshot);
    const write = current
      ? db.prepare("UPDATE issue_queue SET observed_ms = ?, snapshot = ? WHERE id = 1 AND observed_ms = ?")
        .bind(scheduledMs, value, current.observed_ms)
      : db.prepare("INSERT OR IGNORE INTO issue_queue (id, observed_ms, snapshot) VALUES (1, ?, ?)")
        .bind(scheduledMs, value);
    const result = await write.run();
    if (result.meta.changes === 1) return;
  }
  throw new Error("Issue queue changed during reconciliation");
}

const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[c]));

function queuePage(snapshot) {
  const items = snapshot.issues.map((i) => '<li><a href="' + i.url + '">#' + i.number + ' ' +
    escapeHtml(i.title) + '</a>' + (i.helpWanted ? ' <strong>Help Wanted</strong>' : '') + '</li>').join("");
  const status = snapshot.receipt
    ? '<p>' + snapshot.receipt.totalOpen + ' open · ' + snapshot.receipt.helpWanted +
      ' labeled Help Wanted</p><p>Last successful scan ' + snapshot.receipt.completedAt + '</p>'
    : '<p>First scheduled scan pending.</p>';
  return '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<title>Nathan AI Sovereign Hive</title><style>:root{color-scheme:dark}body{font:1rem/1.55 system-ui,sans-serif;max-width:52rem;margin:3rem auto;padding:0 1.25rem}a{color:#a5dcff}li{margin:.65rem 0}code{color:#acebc4}</style>' +
    '<main><h1>Nathan AI Sovereign Hive</h1><p>By Nathan Tabor and Nathan AI</p>' +
    '<p><code>1+1=2</code> Build. <code>1-1=0</code> Clear. <code>1×1=1</code> Integrate. <code>1÷1=1</code> Verify.</p>' +
    status + '<ul>' + items + '</ul><p><a href="/api/queue">Queue and run receipts</a> · ' +
    '<a href="/api/repair/status">Repair queue status</a> · <a href="/api/repair/leads">Global repair leads</a> · ' +
    '<a href="https://nathan-ai-patch-verifier.nathantaboract.workers.dev/api/status">Patch verification receipts</a> · ' +
    '<a href="/api/repair/runtime">Nathan AI / Absolute Intelligence runtime</a> · ' +
    '<a href="https://nathan-ai-help-wanted.nathantaboract.workers.dev/">Public Help Wanted discovery</a> · ' +
    '<a href="https://nathan-ai-workers.nathantaboract.workers.dev/">Worker workspace</a></p></main></html>';
}

const HEADERS = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'"
};

export default {
  async fetch(request, env) {
    const route = new URL(request.url).pathname;
    if (route === "/api/repair/runtime") {
      if (request.method !== "GET") return new Response(null, {status:405,headers:{Allow:"GET"}});
      const [row, profiles] = await Promise.all([
        env.HIVE.prepare("SELECT payload FROM repair_runtime WHERE id=?").bind("linux-node-canary").first(),
        env.HIVE.prepare("SELECT job_id AS job,profile,status,attempts,updated_at AS updatedAt,json_extract(result,'$.checks') AS checks FROM repair_runtime_tasks ORDER BY updated_at DESC LIMIT 20").all()
      ]);
      const receipt = row ? JSON.parse(row.payload) : null;
      const tests = typeof receipt?.stdout === "string" ? Number(/(?:ℹ\s+|#\s+)pass\s+(\d+)/u.exec(receipt.stdout)?.[1] ?? 0) : null;
      return Response.json({
        name:"Nathan AI / Absolute Intelligence",byline:"By Nathan Tabor and Nathan AI",
        anchors:{"1+1=2":"Build","1-1=0":"Clear","1×1=1":"Integrate","1÷1=1":"Verify"},
        status:receipt ? (receipt.ok ? "VERIFIED" : "NEEDS_REVIEW") : "SCHEDULED",
        profiles:profiles.results,
        check:receipt ? {checkedAt:receipt.checkedAt,runtime:receipt.runtime??null,platform:receipt.platform??null,
          command:receipt.command??null,exitCode:receipt.exitCode??null,testsPassed:tests,error:receipt.error??null} : null
      }, {headers:HEADERS});
    }
    if (route.startsWith("/api/repair/")) return repairRoute(request, env);
    if (request.method !== "GET") return new Response("Method not allowed", { status: 405, headers: { Allow: "GET" } });
    const path = new URL(request.url).pathname;
    if (path !== "/" && path !== "/api/queue") return new Response("Not found", { status: 404 });
    const row = await env.HIVE.prepare("SELECT snapshot FROM issue_queue WHERE id = 1").first();
    const snapshot = row ? JSON.parse(row.snapshot) : {
      repository: REPOSITORY, anchors: ["1+1=2", "1-1=0"], status: "pending", issues: [], receipt: null, recentReceipts: []
    };
    if (path === "/api/queue") return Response.json(snapshot, { headers: HEADERS });
    return new Response(queuePage(snapshot), { headers: { ...HEADERS, "Content-Type": "text/html; charset=utf-8" } });
  },

  async scheduled(controller, env) {
    await directInternalScan(env, controller.scheduledTime, collectIssues, validateIssues, compareAndStore);
    await refreshRepairs(env, controller.scheduledTime);
  }
};
