import { createReadStream } from 'node:fs';
import { opendir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import { catalogBatch, catalogBatchSize, catalogRow } from './catalog.mjs';

const [mode, ...args] = process.argv.slice(2);
if (!['--check', '--d1', '--sqlite'].includes(mode) || !args.length
  || (mode === '--sqlite' && args.length < 2)) {
  throw new Error('Use --check PATH, --d1 PATH, or --sqlite DB_FILE PATH. PATH may be a JSONL file or directory.');
}

const files = mode === '--sqlite' ? args.slice(1) : args;
const local = mode === '--sqlite' ? (await import('../local-sqlite.mjs')).openLocalRegistry(args[0]) : null;
const { CLOUDFLARE_ACCOUNT_ID: account, CLOUDFLARE_API_TOKEN: token, CLOUD_SLAYER_DB_ID: db } = process.env;
if (mode === '--d1' && (!account || !token || !db)) {
  throw new Error('Set CLOUDFLARE_ACCOUNT_ID, CLOUD_SLAYER_DB_ID and a D1 write token in CLOUDFLARE_API_TOKEN.');
}

async function* manifestFiles(path) {
  if (!(await stat(path)).isDirectory()) {
    if (!path.endsWith('.jsonl')) throw new Error('Expected a JSONL catalog manifest: ' + path);
    yield path;
    return;
  }
  const entries = [];
  for await (const item of await opendir(path)) {
    if (item.isDirectory() || (item.isFile() && item.name.endsWith('.jsonl'))) entries.push(item.name);
  }
  for (const name of entries.sort()) yield* manifestFiles(join(path, name));
}

async function* records(path) {
  const lines = createInterface({ input: createReadStream(path, { encoding: 'utf8' }), crlfDelay: Infinity });
  let line = 0;
  for await (const text of lines) {
    line++;
    if (!text.trim()) continue;
    try {
      const row = JSON.parse(text);
      catalogRow(row);
      yield row;
    } catch {
      throw new Error('Invalid catalog record in ' + path + ' at line ' + line + '.');
    }
  }
}

async function apply(rows) {
  const batch = catalogBatch(rows);
  if (local) {
    local.sqlite.exec('BEGIN IMMEDIATE');
    try {
      for (const { sql, params } of batch) local.sqlite.prepare(sql).run(...params);
      local.sqlite.exec('COMMIT');
    } catch (error) {
      local.sqlite.exec('ROLLBACK');
      throw error;
    }
  }
  if (mode === '--d1') {
    const response = await fetch('https://api.cloudflare.com/client/v4/accounts/' + encodeURIComponent(account)
      + '/d1/database/' + encodeURIComponent(db) + '/query', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ batch }),
      signal: AbortSignal.timeout(35_000)
    });
    const result = await response.json();
    if (!response.ok || !result.success || result.result?.length !== batch.length
      || !result.result.every(statement => statement.success)) {
      throw new Error('D1 rejected the catalog batch (' + response.status + '). Earlier batches can be replayed safely.');
    }
  }
}

let count = 0;
let manifests = 0;
for (const path of files) {
  for await (const file of manifestFiles(path)) {
    manifests++;
    let pending = [];
    for await (const row of records(file)) {
      count++;
      if (mode === '--check') continue;
      pending.push(row);
      if (pending.length === catalogBatchSize) {
        await apply(pending);
        pending = [];
      }
    }
    if (pending.length) await apply(pending);
  }
}
if (!count) throw new Error('No catalog records found.');
console.log(JSON.stringify({ mode, manifests, records: count }));
local?.sqlite.close();
