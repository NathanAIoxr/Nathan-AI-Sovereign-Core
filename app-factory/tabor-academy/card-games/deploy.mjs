import { readFile } from 'node:fs/promises';
import { buildModules, mount } from './build.mjs';
import { buildSeed } from './catalog.mjs';

const config = JSON.parse(await readFile(new URL('cloudflare.json', import.meta.url),'utf8'));
const { CLOUDFLARE_ACCOUNT_ID: account, CLOUDFLARE_API_TOKEN: token } = process.env;
if (!account || !token) throw new Error('Provide CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN');
const base = 'https://api.cloudflare.com/client/v4/accounts/' + encodeURIComponent(account);
const script = '/workers/dispatch/namespaces/' + config.namespace + '/scripts/' + config.worker;
const dbPath = '/d1/database/' + config.database + '/query';

async function call(path, method = 'GET', body) {
  const headers = { authorization: 'Bearer ' + token };
  if (typeof body === 'string') headers['content-type'] = 'application/json';
  const response = await fetch(base + path, { method, body, headers, signal: AbortSignal.timeout(45000) });
  if (!response.ok) {
    const failure = await response.json().catch(() => ({}));
    throw new Error(method + ' ' + path + ' HTTP ' + response.status + ' ' + (failure.errors || []).map((item) => item.message).join(', '));
  }
  return response;
}

async function api(path, method, body) {
  const { success,result } = await (await call(path,method,body)).json();
  if (!success || (Array.isArray(result) && result.some((entry) => entry.success === false))) {
    throw new Error('Unsuccessful Cloudflare response for ' + path);
  }
  return result;
}

async function query(sql) {
  return api(dbPath,'POST',JSON.stringify({ sql }));
}

async function content() {
  const data = await (await call(script + '/content')).formData();
  const modules = new Map();
  for (const [name, part] of data) {
    if (modules.has(name)) throw new Error('Duplicate Academy module ' + name);
    modules.set(name,typeof part === 'string' ? part : await part.text());
  }
  return modules;
}
const snapshot = (m) => JSON.stringify([...m].sort(([a],[b]) => a.localeCompare(b)));

const { schema,chunks,receipt,release } = await buildSeed();
await query(schema);
for (const sql of chunks) await query(sql);
await query(receipt);

const { bindings } = await api(script + '/settings');
const attached = bindings.find((b) => b.name === config.binding);
if (attached && (attached.database_id ?? attached.id) !== config.database) {
  throw new Error('The existing card games binding points to another database');
}
if (!attached) {
  const form = new FormData();
  const retained = bindings.map((b) => ({ name:b.name,type:'inherit' }));
  retained.push({ name:config.binding,type:'d1',database_id:config.database });
  form.append('settings',new Blob([JSON.stringify({ bindings:retained })],{type:'application/json'}));
  await api(script + '/settings','PATCH',form);
  const verified = (await api(script + '/settings')).bindings;
  if (bindings.some((b) => !verified.some((v) => v.name === b.name && v.type === b.type)) ||
    !verified.some((v) => v.name === config.binding && (v.database_id ?? v.id) === config.database)) {
    throw new Error('The updated Academy bindings did not match expectations');
  }
}

const before = await content();
const after = mount(before,await buildModules());
if (snapshot(before) !== snapshot(after)) {
  if (snapshot(await content()) !== snapshot(before)) throw new Error('The Academy code changed while preparing this release. Retry.');
  const form = new FormData();
  form.append('metadata',new Blob([JSON.stringify({ main_module:'academy-entry.mjs' })],{type:'application/json'}));
  for (const [name, text] of after) form.append(name,new Blob([text],{type:'application/javascript+module'}),name);
  await api(script + '/content','PUT',form);
  if (snapshot(await content()) !== snapshot(after)) throw new Error('The deployed module set differs from the release');
}
console.log('Published card catalog',release,config.publicUrl);
