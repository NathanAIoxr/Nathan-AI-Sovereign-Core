import { readFileSync } from 'node:fs';
import { entryHash, genesis } from '../packages/provenance-ledger/index.js';

const commit = process.argv[2];
if (!/^[a-f0-9]{40}$/.test(commit ?? '')) throw new Error('Expected a Git commit');
const { projects, source } = JSON.parse(readFileSync(new URL('./projects.json', import.meta.url)));

const statements = projects.map(({ id, slug, kind, title }) => ({
  sql: 'INSERT INTO zones_registry (project_id,title,kind,source_path,source_commit) VALUES (?,?,?,?,?) ON CONFLICT(project_id) DO NOTHING',
  params: [id, title, kind, 'zones/staging/projects.json#' + slug, commit],
}));
const hash = await entryHash(source.projectId, 1, genesis, source.sha256, source.bytes);
statements.push({
  sql: `INSERT INTO provenance_ledger (project_id, sequence, previous_hash, content_sha256, size_bytes, entry_hash)
        SELECT ?, 1, ?, ?, ?, ?
        WHERE NOT EXISTS (SELECT 1 FROM provenance_ledger WHERE project_id = ?)
        ON CONFLICT DO NOTHING`,
  params: [source.projectId, genesis, source.sha256, source.bytes, hash, source.projectId],
});
if (process.argv.includes('--json')) {
  process.stdout.write(JSON.stringify(statements));
} else {
  for (const {sql, params} of statements) {
    const args = params.map(value => typeof value === 'number' ? String(value) : "'" + value.replaceAll("'", "''") + "'");
    let index = 0;
    process.stdout.write(sql.replace(/\?/g, () => args[index++]) + ';\n');
  }
}
