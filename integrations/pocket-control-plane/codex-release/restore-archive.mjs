import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { gunzipSync } from 'node:zlib';

const { CLOUDFLARE_API_TOKEN: token, CLOUDFLARE_ACCOUNT_ID: account, CODEX_ARCHIVE_NAMESPACE: archive } = process.env;
const hexIdentifier = /^[a-f0-9]{32}$/;
if (!token || !hexIdentifier.test(account ?? '') || !hexIdentifier.test(archive ?? '')) {
  throw new Error('Provide a Cloudflare KV read token, account ID, and private Codex archive namespace ID.');
}
const output = resolve(process.argv[2] ?? 'restored-codex-archive');
const root = 'https://api.cloudflare.com/client/v4/accounts/' + account + '/storage/kv/namespaces/' + archive;
const headers = { authorization: 'Bearer ' + token };
const request = async (path, options = {}) => {
  const result = await fetch(root + path, { ...options, headers: { ...headers, ...options.headers }, signal: AbortSignal.timeout(20000) });
  if (!result.ok) throw new Error('Cloudflare archive request failed with HTTP ' + result.status);
  return result.json();
};

const manifest = await request('/values/archive-manifest-v1');
if (manifest.version !== 1 || !Array.isArray(manifest.files)) throw new Error('Unknown archive manifest version');
for (const row of manifest.files) {
  if (basename(row.name) !== row.name || !/^[a-z-]+$/.test(row.group) || !/^[a-f0-9]{64}$/.test(row.sha256) ||
      !Number.isSafeInteger(row.fileBytes) || row.fileBytes < 0 || row.fileBytes > 30 * 1024 * 1024 ||
      !Array.isArray(row.parts) || row.parts.some((part, index) =>
        part !== 'v1:' + row.group + ':' + row.sha256 + ':' + String(index).padStart(4, '0'))) {
    throw new Error('Invalid archive file metadata');
  }
  const data = [];
  for (let start = 0; start < row.parts.length; start += 8) {
    const keys = row.parts.slice(start, start + 8);
    const result = await request('/bulk/get', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ keys, type: 'text' }) });
    const values = result.result?.values ?? result.result;
    for (const key of keys) {
      const encoded = values?.[key];
      if (typeof encoded !== 'string') throw new Error('An archive part is missing');
      data.push(Buffer.from(encoded, 'base64'));
    }
  }
  const file = gunzipSync(Buffer.concat(data), { maxOutputLength: Math.max(1, row.fileBytes) });
  if (file.byteLength !== row.fileBytes || createHash('sha256').update(file).digest('hex') !== row.sha256) {
    throw new Error('Restored bytes do not match the archive manifest');
  }
  const folder = resolve(output, row.group, row.sha256.slice(0, 16));
  await mkdir(folder, { recursive: true, mode: 0o700 });
  await writeFile(resolve(folder, row.name), file, { mode: 0o600 });
}
console.log('Restored and verified ' + manifest.files.length + ' original files.');
