import { genesisHeader, expectedHash, verifyHeader } from "./proof.mjs";

const ledgerColumns = "sequence, receipt_id, header_hex, block_hash, recorded_at";
const ledgerTable = "sovereign_header_receipts";

async function receiptId(proof) {
  const bytes = new TextEncoder().encode("tabor:bitcoin-header-proof:v1:" + proof.headerHex + ":" + proof.hash);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("");
}

async function auditRow(row) {
  const proof = await verifyHeader(row.header_hex, row.block_hash);
  if (!proof.ok || await receiptId(proof) !== row.receipt_id) throw new Error("Receipt integrity check failed");
  return { sequence: row.sequence, id: row.receipt_id, recordedAt: row.recorded_at, proof };
}

export async function recordGenesis(db) {
  const proof = await verifyHeader(genesisHeader, expectedHash);
  if (!proof.ok) throw new Error("Genesis fixture did not pass verification");
  const id = await receiptId(proof);
  await db.prepare(
    "INSERT INTO " + ledgerTable + " (receipt_id, header_hex, block_hash, recorded_at) VALUES (?, ?, ?, ?) ON CONFLICT(receipt_id) DO NOTHING"
  ).bind(id, proof.headerHex, proof.hash, new Date().toISOString()).run();
  const row = await db.prepare("SELECT " + ledgerColumns + " FROM " + ledgerTable + " WHERE receipt_id = ?")
    .bind(id).first();
  return auditRow(row);
}

export async function listProofs(db, after) {
  const { results } = await db.prepare(
    "SELECT " + ledgerColumns + " FROM " + ledgerTable + " WHERE sequence > ? ORDER BY sequence LIMIT 26"
  ).bind(after).all();
  const entries = await Promise.all(results.slice(0, 25).map(auditRow));
  return { schema: "tabor.bitcoin-header-proof-ledger.v1", entries, nextAfter: results.length > 25 ? entries.at(-1).sequence : null };
}

export async function proofInput(request) {
  const type = request.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
  if (!["application/json", "application/x-www-form-urlencoded"].includes(type)) {
    return { status: 415, error: "unsupported_content_type" };
  }
  const reader = request.body?.getReader();
  if (!reader) return { status: 400, error: "missing_body" };
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let size = 0;
  let raw = "";
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 2048) {
        void reader.cancel().catch(() => {});
        return { status: 413, error: "body_too_large" };
      }
      raw += decoder.decode(value, { stream: true });
    }
    raw += decoder.decode();
    if (type === "application/json") {
      const value = JSON.parse(raw);
      if (value === null || typeof value !== "object" || Array.isArray(value)) return { status: 400, error: "expected_object" };
      return { value };
    }
    const form = new URLSearchParams(raw);
    return { value: { headerHex: form.get("headerHex"), claimedHash: form.get("claimedHash") || undefined } };
  } catch {
    return { status: 400, error: "invalid_body" };
  }
}

export function verifierPage() {
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Cryptographic Ledger &amp; Double-SHA-256 Block Verifier</title><link rel="stylesheet" href="/catalog.css">
<main><nav><a href="/">Sovereign Currency</a> · <a href="/coins">Coin catalog</a> · <a href="/switchboard">Edge Switchboard</a> · <a href="https://tabor-world-hub.nathantaboract.workers.dev/">Tabor World Hub</a></nav>
<h1>Cryptographic Ledger &amp; Double-SHA-256 Block Verifier</h1>
<h2>Verify a Bitcoin header</h2>
<p>Enter the 80 serialized header bytes in hexadecimal. The optional expected hash uses Bitcoin’s displayed byte order.</p>
<form method="post" action="/api/pow/verify"><p><label>Header hex<br><input name="headerHex" value="${genesisHeader}" pattern="[0-9a-fA-F]{160}" maxlength="160" size="48" required></label></p>
<p><label>Expected hash<br><input name="claimedHash" pattern="[0-9a-fA-F]{64}" maxlength="64" size="48"></label></p>
<button>Verify header</button></form>
<h2>Proof ledger</h2><p>The ledger records and audits the historical Bitcoin genesis proof. Each repeat returns the original receipt.</p>
<form method="post" action="/api/pow/ledger"><button>Record genesis proof</button></form>
<p><a href="/api/pow/ledger">Read saved receipts</a> · <a href="/api/genesis">Run Alpha and Beta genesis checks</a></p>
<h2>Agent downloads</h2><p><a href="/downloads/tabor-sovereign-agent.zip">Download agent source and fixtures</a> · <a href="/api/agent-downloads">Check the archive SHA-256</a></p>
</main></html>`;
}
