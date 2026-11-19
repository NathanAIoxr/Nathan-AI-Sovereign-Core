import { createHash } from 'node:crypto';
import { memoryClient } from './client.js';

const repo = process.env.BACKUP_GITHUB_REPO || '';
const token = process.env.BACKUP_GITHUB_TOKEN;
if (!/^[\w.-]+\/[\w.-]+$/.test(repo) || !token) {
  throw new Error('Set BACKUP_GITHUB_REPO to owner/repo and set BACKUP_GITHUB_TOKEN.');
}
if (!process.env.MEMORY_READ_API_KEY) throw new Error('Set MEMORY_READ_API_KEY for backups.');
if (repo.toLowerCase() === process.env.GITHUB_REPOSITORY?.toLowerCase()) {
  throw new Error('Choose a private backup repository separate from the code repository.');
}
const client = memoryClient(process.env.MEMORY_READ_API_KEY);
const prefix = 'https://api.github.com/repos/' + repo;
const githubHeaders = {
  Authorization: 'Bearer ' + token,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28'
};

async function github(path, { method = 'GET', body, allowMissing = false, accept = githubHeaders.Accept } = {}) {
  const response = await fetch(prefix + path, {
    method,
    headers: { ...githubHeaders, Accept: accept, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(20_000),
    redirect: 'error'
  });
  if (response.status === 404 && allowMissing) return null;
  if (!response.ok) throw new Error('GitHub returned HTTP ' + response.status + '.');
  return response.json();
}

const destination = await github('');
if (destination.private !== true || !destination.default_branch) throw new Error('Use a private backup repository.');
const branch = process.env.BACKUP_GITHUB_BRANCH || destination.default_branch;
const path = '/contents/memory-bank/backup.json';
const existing = await github(path + '?ref=' + encodeURIComponent(branch), { allowMissing: true, accept: 'application/vnd.github.object+json' });
const entries = [];
const maxBytes = 15 * 1024 * 1024;
let bytes = 0;
let before;
do {
  const params = { limit: 50 };
  if (before) params.before_id = before;
  const page = await client('/recall', params);
  for (const entry of page.memories) {
    bytes += Buffer.byteLength(JSON.stringify(entry));
    if (bytes > maxBytes) throw new Error('Backup exceeds the single-file limit.');
    entries.push(entry);
  }
  before = page.next_before_id;
} while (before);

entries.reverse();
const data = JSON.stringify({ version: 1, entries }) + '\n';
const blobHash = createHash('sha1').update('blob ' + Buffer.byteLength(data) + '\0').update(data).digest('hex');
if (existing?.sha === blobHash) {
  console.log('Backup is already current.');
} else {
  await github(path, {
    method: 'PUT',
    body: {
      message: 'Back up memory bank',
      branch,
      content: Buffer.from(data).toString('base64'),
      ...(existing ? { sha: existing.sha } : {})
    }
  });
  console.log('Backed up ' + entries.length + ' memories.');
}
