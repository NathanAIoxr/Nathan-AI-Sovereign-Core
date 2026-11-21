import assert from "node:assert/strict";
import { createHash } from "node:crypto";

const origin = "https://tabor-academy-blueprints.pages.dev";
const hex = /^[a-f0-9]{64}$/;
const digest = value => createHash("sha256").update(value).digest("hex");

async function get(path, type) {
  const response = await fetch(new URL(path, origin), { redirect: "error", signal: AbortSignal.timeout(20_000) });
  assert.ok(response.ok, `${path} returned ${response.status}`);
  return type === "json" ? response.json() : response.text();
}

function verifySnapshot(snapshot, source) {
  const { proof, rows } = snapshot;
  assert.ok(Array.isArray(rows) && rows.length > 0, `${source} is empty`);
  assert.equal(proof.rows, rows.length, `${source} row count`);
  assert.match(proof.merkle_root, hex);
  for (const row of rows) {
    assert.equal(Object.keys(row).length, 19, `${source} lesson ${row.id} column count`);
    assert.equal(row.state, 1, `${source} lesson ${row.id} publish state`);
    assert.match(row.row_sha256, hex);
  }
  assert.equal(new Set(rows.map(row => row.id)).size, rows.length, `${source} duplicate IDs`);
  assert.equal(digest(JSON.stringify(rows)), proof.verified_export_sha256, `${source} export digest`);
}

const [live, proof, lessons, offline, health, orderedCatalog] = await Promise.all([
  get("/api/curriculum-snapshot", "json"),
  get("/api/integrity", "json"),
  get("/api/lessons", "json"),
  get("/tabor-academy-offline.html", "text"),
  get("/api/healthz", "json"),
  get("/curriculum/", "text"),
]);

const inline = offline.match(/<script>globalThis\.ACADEMY_OFFLINE=(\{.*?\})<\/script>/s);
assert.ok(inline, "Offline curriculum payload is missing");
const bundled = JSON.parse(inline[1]);
verifySnapshot(live, "D1");
verifySnapshot(bundled, "offline");
assert.deepEqual(live.proof, proof, "D1 integrity endpoint disagrees with snapshot");
assert.deepEqual(bundled.proof, proof, "Offline bundle and live D1 disagree");
assert.deepEqual(lessons.map(row => row.id).sort((a,b) => a-b),
  live.rows.map(row => row.id).sort((a,b) => a-b), "Public lesson IDs disagree with D1 snapshot");
assert.equal(health.d1, true, "Production D1 is unavailable");
assert.ok(orderedCatalog.includes("</main>"), "Ordered curriculum is unavailable");

process.stdout.write(JSON.stringify({ checkedAt: new Date().toISOString(), origin, proof,
  offlineBundleSha256: digest(offline), canary: health.canary?.checked_at ?? null }, null, 2) + "\n");
