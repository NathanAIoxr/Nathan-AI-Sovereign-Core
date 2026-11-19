import { readFile } from 'node:fs/promises';
import { auditProject, consumeAudits } from './audit.mjs';

const { CLOUDFLARE_ACCOUNT_ID: account, CLOUDFLARE_API_TOKEN: token, GITHUB_RUN_ID, GITHUB_RUN_ATTEMPT } = process.env;
if (!account || !token) throw new Error('Provide the Cloudflare deploy credentials');
const base = 'https://api.cloudflare.com/client/v4/accounts/' + account;
const { source } = JSON.parse(await readFile(new URL('./projects.json', import.meta.url), 'utf8'));
const database = '/d1/database/2b29b82e-323e-4f92-b355-1df89c67024c/query';
const queue = '/queues/78e1657f098f471ab2d03fcab890011d';
const bucket = '/r2/buckets/tabor-sovereign-provenance/objects/';

async function request(path, data) {
  const headers = { Authorization: 'Bearer ' + token };
  if (data !== undefined) headers['Content-Type'] = 'application/json';
  const response = await fetch(base + path, {
    method: data === undefined ? 'GET' : 'POST',
    headers,
    body: data === undefined ? undefined : JSON.stringify(data),
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error('Cloudflare request returned HTTP ' + response.status);
  return response;
}

async function api(path, data) {
  const result = await (await request(path, data)).json();
  if (!result.success) throw new Error('Cloudflare operation failed');
  return result.result;
}

const adapters = {
  async query(sql, params) {
    const [result] = await api(database, { sql, params });
    if (!result?.success) throw new Error('D1 query failed');
    return result.results;
  },
  async readArtifact(hash) {
    return (await request(bucket + encodeURIComponent('sha256/' + hash))).arrayBuffer();
  },
};

const sourceRows = await adapters.query(
  'SELECT content_sha256,size_bytes FROM provenance_ledger WHERE project_id = ? AND sequence = 1',
  [source.projectId]
);
if (sourceRows[0]?.content_sha256 !== source.sha256 || sourceRows[0]?.size_bytes !== source.bytes) {
  throw new Error('D1 archive entry differs from the GitHub manifest');
}
console.log(JSON.stringify(await auditProject(adapters, source.projectId,
  'sentinel-' + (GITHUB_RUN_ID ?? Date.now()) + '-' + (GITHUB_RUN_ATTEMPT ?? '1'))));
await consumeAudits(api, adapters, queue);
