import { transcript } from './manifest-source.mjs';

export const nodePath = '/ai-nodes';
export const receiptPath = '/api/manifest-node/receipt';
export const runPath = '/api/manifest-node/run';
export const sourcePath = '/ai-nodes/source.txt';
const parameters = ['1+1=2', '1-1=0', '100% truth'];
const encoder = new TextEncoder();

export async function sourceHash() {
  const bytes = await crypto.subtle.digest('SHA-256', encoder.encode(transcript));
  return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
}

async function authorized(request, secret) {
  if (!secret) return false;
  const supplied = request.headers.get('Authorization');
  if (!supplied || supplied.length !== secret.length + 7) return false;
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), {
    name: 'HMAC', hash: 'SHA-256'
  }, false, ['sign', 'verify']);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode('manifest-node-v1'));
  const candidate = await crypto.subtle.importKey('raw', encoder.encode(supplied.slice(7)), {
    name: 'HMAC', hash: 'SHA-256'
  }, false, ['verify']);
  return supplied.startsWith('Bearer ') &&
    await crypto.subtle.verify('HMAC', candidate, signature, encoder.encode('manifest-node-v1'));
}

export async function executeManifestNode(db, hash) {
  await db.batch([
    db.prepare('INSERT INTO manifest_node_receipts (source_sha256) VALUES (?) ON CONFLICT DO NOTHING').bind(hash),
    db.prepare('UPDATE manifest_node_receipts SET build_units = build_units + 1 WHERE source_sha256 = ? AND verified_at IS NULL').bind(hash),
    db.prepare('UPDATE manifest_node_receipts SET clear_units = clear_units - 1 WHERE source_sha256 = ? AND verified_at IS NULL').bind(hash),
    db.prepare("UPDATE manifest_node_receipts SET verified_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE source_sha256 = ? AND verified_at IS NULL").bind(hash)
  ]);
}

async function readReceipt(db, hash) {
  const row = await db.prepare(
    'SELECT source_sha256, build_units, clear_units, verified_at FROM manifest_node_receipts WHERE source_sha256 = ? AND verified_at IS NOT NULL'
  ).bind(hash).first();
  if (!row) return null;
  if (row.source_sha256 !== hash || row.build_units !== 2 || row.clear_units !== 0) {
    throw new Error('Receipt failed read-back verification');
  }
  return {
    command: 'MANIFEST_NODE',
    status: 'VERIFIED',
    payload: {
      objective: 'Write and verify the Manifestation AI-node record in Cloudflare D1',
      parameters,
      source_sha256: row.source_sha256,
      timestamp: row.verified_at
    },
    evidence: {
      store: 'Cloudflare D1',
      build: { before: 1, after: row.build_units },
      clear: { before: 1, after: row.clear_units }
    }
  };
}

export async function handleManifestApi(request, env, path, reply) {
  const read = path === receiptPath;
  const method = request.method;
  const json = (body, status = 200, headers = {}) => reply(
    method === 'HEAD' ? null : JSON.stringify(body),
    'application/json',
    status,
    { 'Cache-Control': 'no-store', ...headers }
  );

  if (read ? !['GET', 'HEAD'].includes(method) : method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405, { Allow: read ? 'GET, HEAD' : 'POST' });
  }
  if (!read && !await authorized(request, env.MANIFEST_NODE_TOKEN)) {
    return json({ error: 'Authorization required' }, 401, { 'WWW-Authenticate': 'Bearer' });
  }
  if (!read && request.body !== null) return json({ error: 'Send an empty body' }, 400);
  if (!env.MANIFEST_NODE_DB) return json({ error: 'Database unavailable' }, 503);

  try {
    const hash = await sourceHash();
    if (!read) await executeManifestNode(env.MANIFEST_NODE_DB, hash);
    const receipt = await readReceipt(env.MANIFEST_NODE_DB, hash);
    if (receipt) return json(receipt);
    if (read) return json({ status: 'PENDING' }, 404);
  } catch {
    return json({ error: 'Receipt verification unavailable' }, 503);
  }
  return json({ error: 'Receipt verification unavailable' }, 503);
}
