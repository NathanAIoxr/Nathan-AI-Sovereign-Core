import { readFile } from 'node:fs/promises';
const root = new URL('.', import.meta.url);
const config = JSON.parse(await readFile(new URL('deployment.json', root), 'utf8'));
const { CLOUDFLARE_ACCOUNT_ID: account, CLOUDFLARE_API_TOKEN: token } = process.env;
if (!account || !token) throw new Error('Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN.');
const api = 'https://api.cloudflare.com/client/v4/accounts/' + encodeURIComponent(account) + '/workers/scripts/';
async function request(path, method, body, isJson = false) {
  const headers = { Authorization: 'Bearer ' + token };
  if (isJson) headers['Content-Type'] = 'application/json';
  const response = await fetch(api + path, { method, body, headers });
  const data = await response.json();
  if (!response.ok || !data.success) throw new Error(path + ' · ' + (data.errors ?? []).map(error => error.message).join(', '));
  return data.result;
}
for (const worker of config.workers) {
  const form = new FormData();
  const metadata = { main_module: worker.entry, compatibility_date: config.compatibilityDate, bindings: worker.bindings ?? [] };
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  for (const name of [worker.entry, ...worker.modules]) {
    form.append(name, new Blob([await readFile(new URL('dist/' + name, root))], { type: 'application/javascript+module' }), name);
  }
  await request(worker.name, 'PUT', form);
  await request(worker.name + '/subdomain', 'POST', JSON.stringify({ enabled: worker.public, previews_enabled: false }), true);
  console.log('Deployed ' + worker.name);
}
