import { inventoryBatch } from './inventory.mjs';

const { CLOUDFLARE_ACCOUNT_ID: account, CLOUDFLARE_API_TOKEN: token, CLOUD_SLAYER_DB_ID: db } = process.env;
if (!account || !token || !db) throw new Error('Set CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN and CLOUD_SLAYER_DB_ID.');
const root = 'https://api.cloudflare.com/client/v4/accounts/' + encodeURIComponent(account);
async function request(path, options = {}) {
  const response = await fetch(root + path, { ...options, headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' } });
  const data = await response.json();
  if (!response.ok || !data.success) throw new Error('Cloudflare request failed (' + response.status + ').');
  return data;
}
const inventory = [];
for (let page = 1; ; page++) {
  const result = await request('/workers/scripts?page=' + page);
  if (!Array.isArray(result.result)) throw new Error('Cloudflare returned an invalid Worker inventory.');
  inventory.push(...result.result.map(worker => worker.id));
  if (page >= (result.result_info?.total_pages ?? 1)) break;
}
const snapshot = new Date().toISOString();
const result = await request('/d1/database/' + encodeURIComponent(db) + '/query', {
  method: 'POST',
  body: JSON.stringify({ batch: inventoryBatch(inventory, snapshot) })
});
if (result.result.some(statement => !statement.success)) throw new Error('D1 rejected the inventory snapshot.');
console.log(JSON.stringify({ recorded_workers: new Set(inventory).size, inventory_as_of: snapshot }));
