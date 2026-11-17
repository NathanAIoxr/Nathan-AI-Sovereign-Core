const TARGETS = {
  "github:goldener-data/goldener#422": {
    repository: "goldener-data/goldener",
    paths: new Set(["README.md", "docs/posts/GOLD_DENSITY_WEIGHING.md"])
  },
  "github:open-glassbeetle/glassbeetle#341": {
    repository: "Open-Glassbeetle/glassbeetle",
    paths: new Set(["apps/api/test/projects-artifacts.e2e-spec.ts"])
  }
};

const SELECT_HANDOFFS = `
  SELECT h.job_id, h.job_status, h.source_receipt,
    v.checked_at, v.status, v.base, v.files, v.hunks, v.reason, v.execution
  FROM repair_handoff_outbox h
  LEFT JOIN repair_patch_checks v ON v.job_id = h.job_id
    AND v.source_receipt = h.source_receipt
  WHERE h.job_id IN (?, ?) ORDER BY h.job_id
`;

const STORE_CHECK = `
  INSERT INTO repair_patch_checks
    (job_id, source_receipt, checked_at, status, base, files, hunks, reason, execution)
  SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?
  WHERE EXISTS(SELECT 1 FROM repair_handoff_outbox WHERE job_id = ? AND source_receipt = ?)
  ON CONFLICT(job_id) DO UPDATE SET source_receipt=excluded.source_receipt,
    checked_at=excluded.checked_at, status=excluded.status, base=excluded.base,
    files=excluded.files, hunks=excluded.hunks, reason=excluded.reason, execution=excluded.execution
  WHERE excluded.checked_at > repair_patch_checks.checked_at
    OR (excluded.checked_at = repair_patch_checks.checked_at
        AND excluded.source_receipt <> repair_patch_checks.source_receipt)
`;

class PendingSource extends Error {}

function parseDiff(diff, allowed) {
  if (typeof diff !== "string" || !diff.startsWith("diff --git ") || diff.length > 50000) {
    throw Error("Expected a bounded unified diff");
  }
  const files = new Map();
  let file, hunk;
  for (const line of diff.split("\n")) {
    if (line.startsWith("diff --git ")) {
      const match = /^diff --git a\/([^ ]+) b\/([^ ]+)$/.exec(line);
      if (!match || match[1] !== match[2] || !allowed.has(match[1]) || files.has(match[1])) {
        throw Error("Diff includes an unsupported path or operation");
      }
      file = { path: match[1], hunks: [], created: false, oldHeader: false, newHeader: false };
      files.set(file.path, file);
      hunk = null;
    } else if (line.startsWith("@@ ")) {
      const m = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@(?: .*)?$/.exec(line);
      if (!m || !file?.oldHeader || !file.newHeader) throw Error("Invalid hunk header");
      const [, oldLine, oldCount = "1", newLine, newCount = "1"] = m;
      hunk = { oldLine: Number(oldLine), oldCount: Number(oldCount), newLine: Number(newLine),
        newCount: Number(newCount), before: [], after: [] };
      file.hunks.push(hunk);
    } else if (hunk && " +-".includes(line[0])) {
      if (line[0] !== "+") hunk.before.push(line.slice(1));
      if (line[0] !== "-") hunk.after.push(line.slice(1));
    } else if (!hunk && line.startsWith("--- ")) {
      file.created = line === "--- /dev/null";
      file.oldHeader = file.created || line === "--- a/" + file.path;
    } else if (!hunk && line.startsWith("+++ ")) {
      file.newHeader = line === "+++ b/" + file.path;
    } else if (line !== "" && !(file && !hunk && /^(index [0-9a-f]+\.\.[0-9a-f]+(?: 100644)?|new file mode 100644)$/.test(line))) {
      throw Error("Unexpected unified diff content");
    }
  }
  for (const f of files.values()) {
    if (!f.hunks.length || (f.created && f.hunks.length !== 1)) throw Error("Invalid file hunks");
    let priorEnd = 0;
    let offset = 0;
    for (const h of f.hunks) {
      if (!f.created && (!h.oldCount || h.oldLine < 1)) throw Error("Expected source context");
      const oldIndex = h.oldCount ? h.oldLine - 1 : h.oldLine;
      const newIndex = h.newCount ? h.newLine - 1 : h.newLine;
      if (h.before.length !== h.oldCount || h.after.length !== h.newCount ||
          oldIndex < priorEnd || newIndex !== oldIndex + offset ||
          (f.created && (h.oldLine !== 0 || h.oldCount !== 0 || !h.newCount))) {
        throw Error("Hunk count or position is inconsistent");
      }
      priorEnd = oldIndex + h.oldCount;
      offset += h.newCount - h.oldCount;
    }
  }
  return [...files.values()];
}

export async function verifyPatch(jobId, receipt, read = fetch) {
  const target = TARGETS[jobId];
  if (!target || !/^[0-9a-f]{40}$/i.test(receipt.base || "")) throw Error("Missing pinned Git revision");
  const files = parseDiff(receipt.patch, target.paths);
  for (const f of files) {
    const url = "https://raw.githubusercontent.com/" + target.repository + "/" + receipt.base + "/" + f.path;
    const response = await read(url, { redirect: "error", signal: AbortSignal.timeout(10000) });
    if (f.created && response.status === 404) continue;
    if (!response.ok) throw new PendingSource("Source read returned HTTP " + response.status);
    if (f.created) throw Error("New file already exists at the pinned revision");
    const code = await response.text();
    if (code.length > 300000) throw Error("Source exceeds verifier size limit");
    const source = code.split("\n");
    for (const h of f.hunks) {
      if (h.before.some((line, i) => line !== source[h.oldLine - 1 + i])) {
        throw Error("Source context differs at the pinned revision");
      }
    }
  }
  return { base: receipt.base, files: files.length, hunks: files.reduce((n, f) => n + f.hunks.length, 0) };
}

export async function refreshChecks(db, scheduledAt, read = fetch) {
  const rows = (await db.prepare(SELECT_HANDOFFS).bind(...Object.keys(TARGETS)).all()).results;
  for (const row of rows) {
    if (row.checked_at >= scheduledAt ||
        (row.status === "SOURCE_MATCH" && row.execution === "Cloudflare scheduled run")) continue;
    let status = "SOURCE_MATCH", reason = null, proof = {base:null,files:0,hunks:0};
    try {
      proof = await verifyPatch(row.job_id, JSON.parse(row.source_receipt), read);
    } catch (error) {
      status = error instanceof PendingSource || error.name === "TimeoutError" ||
        error.name === "AbortError" || error instanceof TypeError ? "SOURCE_UNAVAILABLE" : "REVIEW";
      reason = error instanceof TypeError ? "Network or source-read error" : error.message.slice(0, 180);
    }
    await db.prepare(STORE_CHECK).bind(row.job_id, row.source_receipt, scheduledAt, status, proof.base,
      proof.files, proof.hunks, reason, "Cloudflare scheduled run", row.job_id, row.source_receipt).run();
  }
}

export default {
  async fetch(request, env) {
    if (request.method !== "GET") return new Response("Method not allowed", {status:405,headers:{Allow:"GET"}});
    const path = new URL(request.url).pathname;
    if (path !== "/" && path !== "/api/status") return new Response("Not found", {status:404});
    const rows = (await env.HIVE.prepare(SELECT_HANDOFFS).bind(...Object.keys(TARGETS)).all()).results;
    return Response.json({
      name: "Nathan AI Absolute Intelligence Patch Verifier",
      byline: "By Nathan Tabor and Nathan AI",
      build: "1+1=2", clear: "1-1=0", integrate: "1×1=1", verify: "1÷1=1",
      verification: "Pinned source context",
      checks: rows.map(({source_receipt, ...row}) => row)
    }, {headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
  },
  async scheduled(controller, env) {
    await refreshChecks(env.HIVE, controller.scheduledTime);
  }
};
