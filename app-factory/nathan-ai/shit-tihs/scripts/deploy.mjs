import { readFile, readdir } from 'node:fs/promises';

const { CLOUDFLARE_API_TOKEN: token, CLOUDFLARE_ACCOUNT_ID: account } = process.env;
if (!token || !account) throw new Error('Set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID.');
const slug = 'shit-tihs';
async function call(url, method, body, extraHeaders = {}) {
  const response = await fetch(url, { method, body, headers: { Authorization: `Bearer ${token}`, ...extraHeaders } });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(JSON.stringify(result.errors));
  return result.result;
}

async function deployToR2() {
  const bucket = `https://api.cloudflare.com/client/v4/accounts/${account}/r2/buckets/${slug}`;
  const publicDir = new URL('../public/', import.meta.url);
  const mime = new Map([
    ['html', 'text/html; charset=utf-8'], ['css', 'text/css; charset=utf-8'],
    ['mjs', 'text/javascript; charset=utf-8'], ['js', 'text/javascript; charset=utf-8'],
    ['webmanifest', 'application/manifest+json'], ['png', 'image/png']
  ]);
  const names = await readdir(publicDir);
  const last = ['sw.js', 'index.html'];
  for (const name of [...names.filter(name => !last.includes(name)), ...last]) {
    const type = mime.get(name.split('.').at(-1));
    if (!type) throw new Error(`Unsupported public asset: ${name}`);
    const content = await readFile(new URL(name, publicDir));
    await call(`${bucket}/objects/${encodeURIComponent(name)}`, 'PUT', content, { 'Content-Type': type });
  }
  const domain = await call(`${bucket}/domains/managed`, 'GET');
  if (!domain.enabled) throw new Error('Enable the managed public URL on the dedicated shit-tihs bucket.');
  console.log(`https://${domain.domain}/index.html`);
}

if (process.argv.includes('--r2')) {
  await deployToR2();
} else {
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${account}/workers/scripts/${slug}`;
  const source = await readFile(new URL('../.build/worker.mjs', import.meta.url));
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify({
    main_module: 'worker.mjs',
    compatibility_date: '2026-11-19'
  })], { type: 'application/json' }));
  form.append('worker.mjs', new Blob([source], { type: 'application/javascript+module' }), 'worker.mjs');

  const result = await call(endpoint, 'PUT', form);
  await call(`${endpoint}/subdomain`, 'POST', JSON.stringify({ enabled: true }), { 'Content-Type': 'application/json' });
  console.log(`Deployed ${result.id || slug}.`);
}
