import { readFile } from 'node:fs/promises';

const { CLOUDFLARE_API_TOKEN: token, CLOUDFLARE_ACCOUNT_ID: account } = process.env;
if (!token || !account) throw new Error('Set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID.');
const slug = 'shit-tihs';
const endpoint = `https://api.cloudflare.com/client/v4/accounts/${account}/workers/scripts/${slug}`;
const source = await readFile(new URL('../.build/worker.mjs', import.meta.url));
const form = new FormData();
form.append('metadata', new Blob([JSON.stringify({
  main_module: 'worker.mjs',
  compatibility_date: '2026-11-19'
})], { type: 'application/json' }));
form.append('worker.mjs', new Blob([source], { type: 'application/javascript+module' }), 'worker.mjs');

async function call(url, method, body, extraHeaders = {}) {
  const response = await fetch(url, { method, body, headers: { Authorization: `Bearer ${token}`, ...extraHeaders } });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(JSON.stringify(result.errors));
  return result.result;
}

const result = await call(endpoint, 'PUT', form);
await call(`${endpoint}/subdomain`, 'POST', JSON.stringify({ enabled: true }), { 'Content-Type': 'application/json' });
console.log(`Deployed ${result.id || slug}.`);
