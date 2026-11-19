import { inventoryRow, snapshotSql } from './snapshot.js';

const { CLOUDFLARE_ACCOUNT_ID: account, CLOUDFLARE_API_TOKEN: token } = process.env;
if (!/^[0-9a-f]{32}$/.test(account || '') || !token) throw new Error('Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN.');
const database = '00e422eb-5222-4892-8f90-74aaf8ab0518';
const prefix = 'https://api.cloudflare.com/client/v4/accounts/' + account;
const stamp = new Date().toISOString();

async function cf(path, body) {
  const response = await fetch(prefix + path, {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    redirect: 'error',
    signal: AbortSignal.timeout(30_000)
  });
  const data = await response.json();
  if (!response.ok || !data.success || data.result?.some?.(row => row?.success === false)) {
    throw new Error('Cloudflare request failed for ' + path.split('?')[0] + ' (' + response.status + ').');
  }
  return data;
}

async function listAccount() {
  const rows = [];
  for (let page = 1; ; page++) {
    const result = await cf('/workers/scripts?per_page=50&page=' + page);
    rows.push(...result.result.map(script => inventoryRow(script, 'account')));
    const pages = result.result_info?.total_pages;
    if (!pages || page >= pages) return rows;
  }
}

async function listNamespace(namespace) {
  const path = '/workers/dispatch/namespaces/' + encodeURIComponent(namespace) + '/scripts';
  const items = [];
  const seen = new Set();
  let cursor = '';
  do {
    const response = await cf(path + (cursor ? '?cursor=' + encodeURIComponent(cursor) : ''));
    items.push(...response.result.map(script => inventoryRow(script, namespace)));
    cursor = response.result_info?.cursor || '';
    if (cursor && seen.has(cursor)) throw new Error('Cloudflare repeated a namespace page.');
    seen.add(cursor);
  } while (cursor);
  return items;
}

const [accountScripts, { result: namespaces }] = await Promise.all([
  listAccount(),
  cf('/workers/dispatch/namespaces')
]);
const rows = [...accountScripts];
for (const namespace of namespaces) rows.push(...await listNamespace(namespace.namespace_name));
if (!rows.length || new Set(rows.map(row => row.key)).size !== rows.length) {
  throw new Error('The inventory is empty or contains duplicate script identifiers.');
}
await cf('/d1/database/' + database + '/query', { sql: snapshotSql, params: [JSON.stringify(rows), stamp] });
console.log('Verified ' + rows.length + ' owned Cloudflare Worker listings.');
