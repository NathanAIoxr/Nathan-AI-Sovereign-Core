import { readFile } from 'node:fs/promises';

const id = process.argv[2];
if (!['taborpoolboys','kristian-plaque'].includes(id)) throw new Error('Unrecognized deployment target');
const account = process.env.CLOUDFLARE_ACCOUNT_ID;
const token = process.env.CLOUDFLARE_API_TOKEN;
if (!account || !token) throw new Error('Cloudflare deployment credentials are required');
const app = JSON.parse(await readFile(new URL('../' + id + '/app.json', import.meta.url), 'utf8'));
const source = await readFile(new URL('../' + id + '/worker.mjs', import.meta.url), 'utf8');
const core = await readFile(new URL('./worker.mjs', import.meta.url), 'utf8');
const entry = source.replace('../tabor-app-runtime/worker.mjs', './runtime.mjs');
const form = new FormData();
form.append('metadata', new Blob([JSON.stringify({
  main_module:'worker.mjs',
  compatibility_date:'2026-11-01',
  tags:['tabor-installable-app',id],
})], {type:'application/json'}));
form.append('worker.mjs', new Blob([entry],{type:'application/javascript+module'}), 'worker.mjs');
form.append('runtime.mjs', new Blob([core],{type:'application/javascript+module'}), 'runtime.mjs');
const url = 'https://api.cloudflare.com/client/v4/accounts/' + encodeURIComponent(account) +
  '/workers/dispatch/namespaces/nathan-tabor-platforms/scripts/' + encodeURIComponent(app.worker);
const response = await fetch(url, {
  method: 'PUT',
  headers: { Authorization: 'Bearer ' + token },
  body: form,
  signal: AbortSignal.timeout(30_000),
});
const result = await response.json();
if (!response.ok || !result.success) throw new Error('Cloudflare deploy failed: ' + JSON.stringify(result.errors));
console.log('Published ' + app.worker);
