import { entryHash, genesis, merkleRoot, sha256 } from '../packages/provenance-ledger/index.js';

const projectId = /^[a-z0-9-]{1,100}$/;
const auditId = /^[a-zA-Z0-9-]{1,80}$/;
const digest = /^[a-f0-9]{64}$/;

export async function auditProject({ query, readArtifact }, project, audit) {
  if (!projectId.test(project) || !auditId.test(audit)) throw new Error('Invalid audit identifier');
  const [{ ceiling }] = await query('SELECT MAX(sequence) AS ceiling FROM provenance_ledger WHERE project_id = ?', [project]);
  const [anchor] = await query(
    'SELECT entry_count,merkle_root FROM integrity_audits WHERE project_id = ? ORDER BY entry_count DESC, checked_at DESC LIMIT 1',
    [project]
  );
  if (anchor && anchor.entry_count > (ceiling ?? 0)) throw new Error('Previously audited ledger entries are missing');
  const hashes = [];
  let previous = genesis;
  let cursor = 0;
  while (cursor < (ceiling ?? 0)) {
    const rows = await query(
      'SELECT sequence, content_sha256, previous_hash, entry_hash, size_bytes FROM provenance_ledger WHERE project_id = ? AND sequence > ? AND sequence <= ? ORDER BY sequence LIMIT 25',
      [project, cursor, ceiling]
    );
    if (!rows.length) throw new Error('Ledger sequence missing');
    for (const row of rows) {
      const { sequence, content_sha256: content, previous_hash: parent, entry_hash: hash, size_bytes: size } = row;
      if (sequence !== cursor + 1 || parent !== previous || !digest.test(content) ||
          await entryHash(project, sequence, parent, content, size) !== hash) {
        throw new Error('Invalid ledger chain at entry ' + sequence);
      }
      const data = await readArtifact(content);
      if (data.byteLength !== size || await sha256(data) !== content) {
        throw new Error('Invalid artifact at entry ' + sequence);
      }
      hashes.push(hash);
      cursor = sequence;
      previous = hash;
    }
  }
  const root = await merkleRoot(hashes);
  if (anchor && await merkleRoot(hashes.slice(0, anchor.entry_count)) !== anchor.merkle_root) {
    throw new Error('Ledger no longer matches its prior audit');
  }
  await query(
    'INSERT INTO integrity_audits (project_id,audit_id,entry_count,merkle_root) VALUES (?,?,?,?) ON CONFLICT DO NOTHING',
    [project, audit, hashes.length, root]
  );
  const [receipt] = await query('SELECT entry_count,merkle_root FROM integrity_audits WHERE project_id = ? AND audit_id = ?', [project, audit]);
  return { project, audit, count: receipt.entry_count, root: receipt.merkle_root };
}

export async function consumeAudits(api, adapters, queue) {
  const { messages } = await api(queue + '/messages/pull', { batch_size: 3, visibility_timeout_ms: 300000 });
  const acks = [];
  const failures = [];
  for (const message of messages ?? []) {
    try {
      const data = JSON.parse(message.body);
      if (data.type !== 'integrity-audit' || !projectId.test(data.projectId) || !auditId.test(data.auditId)) {
        throw new Error('Unexpected audit message');
      }
      const prior = await adapters.query('SELECT 1 FROM integrity_audits WHERE project_id = ? AND audit_id = ?', [data.projectId, data.auditId]);
      if (!prior.length) console.log(JSON.stringify(await auditProject(adapters, data.projectId, data.auditId)));
      acks.push({ lease_id: message.lease_id });
    } catch (error) {
      failures.push(error.message);
    }
  }
  if (acks.length) await api(queue + '/messages/ack', { acks });
  if (failures.length) throw new Error(failures.join('\n'));
}
