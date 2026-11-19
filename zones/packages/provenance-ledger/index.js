export const MAX_ARTIFACT_BYTES = 1024 * 1024;
export const genesis = '0'.repeat(64);

export async function sha256(data) {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash), value => value.toString(16).padStart(2, '0')).join('');
}

export function entryHash(project, sequence, previous, content, size) {
  return sha256(JSON.stringify([project, sequence, previous, content, size]));
}

export async function merkleRoot(entries) {
  if (entries.length === 0) return sha256('');
  let level = entries;
  while (level.length > 1) {
    const next = [];
    for (let index = 0; index < level.length; index += 2) {
      next.push(sha256(level[index] + (level[index + 1] ?? level[index])));
    }
    level = await Promise.all(next);
  }
  return level[0];
}

export const compareAndAppend = `
INSERT INTO provenance_ledger (project_id, sequence, content_sha256, previous_hash, entry_hash, size_bytes)
SELECT ?, ?, ?, ?, ?, ?
WHERE COALESCE((SELECT entry_hash FROM provenance_ledger WHERE project_id = ? ORDER BY sequence DESC LIMIT 1), ?) = ?
ON CONFLICT DO NOTHING`;

export async function recordArtifact(db, project, content, size) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const existing = await db.prepare(
      'SELECT sequence, entry_hash FROM provenance_ledger WHERE project_id = ? AND content_sha256 = ?'
    ).bind(project, content).first();
    if (existing) return { ...existing, content_sha256: content };

    const head = await db.prepare(
      'SELECT sequence, entry_hash FROM provenance_ledger WHERE project_id = ? ORDER BY sequence DESC LIMIT 1'
    ).bind(project).first();
    const sequence = (head?.sequence ?? 0) + 1;
    const previous = head?.entry_hash ?? genesis;
    const hash = await entryHash(project, sequence, previous, content, size);
    const inserted = await db.prepare(compareAndAppend)
      .bind(project, sequence, content, previous, hash, size, project, genesis, previous).run();
    if (inserted.meta.changes === 1) return { sequence, entry_hash: hash, content_sha256: content };
  }
  throw new Error('Ledger head changed repeatedly');
}

export async function storeArtifact(env, project, bytes) {
  const content = await sha256(bytes);
  const key = 'sha256/' + content;
  if (!await env.PROVENANCE.head(key)) {
    await env.PROVENANCE.put(key, bytes, {
      onlyIf: { etagDoesNotMatch: '*' },
      sha256: content,
      httpMetadata: { contentType: 'application/octet-stream' },
    });
  }
  return recordArtifact(env.ZONES, project, content, bytes.byteLength);
}
