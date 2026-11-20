import { biofilm, project, safeId } from "./engine.mjs";

const encoder = new TextEncoder();
const digestPattern = /^[a-f0-9]{64}$/;
const signaturePattern = /^[a-f0-9]{128}$/;
const maximumWindowUnits = 1000000;

export const schema = `CREATE TABLE IF NOT EXISTS verified_cleanup (
  workspace TEXT NOT NULL,
  window_id TEXT NOT NULL,
  receipt_hash TEXT NOT NULL UNIQUE,
  bytes_reclaimed INTEGER NOT NULL CHECK(bytes_reclaimed BETWEEN 1024 AND 1024000000),
  expires_at INTEGER NOT NULL,
  PRIMARY KEY(workspace, window_id)
)`;

function parseHex(value) {
  return Uint8Array.from(value.match(/../g), pair => parseInt(pair, 16));
}

export function signedMessage(namespace, claim) {
  return encoder.encode(JSON.stringify([project, namespace, 1, claim.workspace, claim.window,
    claim.receiptHash, claim.bytesReclaimed, claim.expiresAt]));
}

export async function verifyClaim(namespace, publicKey, claim, now = Math.floor(Date.now() / 1000)) {
  if (!safeId(namespace) || !digestPattern.test(publicKey ?? "") || !safeId(claim?.workspace) ||
    !safeId(claim.window) || typeof claim.receiptHash !== "string" || !digestPattern.test(claim.receiptHash) ||
    !Number.isSafeInteger(claim.bytesReclaimed) || claim.bytesReclaimed < 1024 ||
    claim.bytesReclaimed > maximumWindowUnits * 1024 || !Number.isSafeInteger(claim.expiresAt) ||
    claim.expiresAt < now || claim.expiresAt > now + 86400 ||
    typeof claim.signature !== "string" || !signaturePattern.test(claim.signature)) return false;
  const key = await crypto.subtle.importKey("raw", parseHex(publicKey), "Ed25519", false, ["verify"]);
  return crypto.subtle.verify("Ed25519", key, parseHex(claim.signature), signedMessage(namespace, claim));
}

export async function ledgerTotals(db, workspace) {
  const result = await db.prepare(
    "SELECT COUNT(*) AS receipts, COALESCE(SUM(bytes_reclaimed / 1024), 0) AS units FROM verified_cleanup WHERE workspace = ?"
  ).bind(workspace).first();
  return { receipts: result.receipts, ...biofilm(result.units) };
}

export async function recordClaim(db, claim) {
  const result = await db.prepare(
    "INSERT INTO verified_cleanup (workspace,window_id,receipt_hash,bytes_reclaimed,expires_at) VALUES (?,?,?,?,?) ON CONFLICT DO NOTHING"
  ).bind(claim.workspace, claim.window, claim.receiptHash, claim.bytesReclaimed, claim.expiresAt).run();
  return { inserted: result.meta.changes === 1, ...(await ledgerTotals(db, claim.workspace)) };
}
