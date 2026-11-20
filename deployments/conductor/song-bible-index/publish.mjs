import { countsQuery, databaseId, statements } from './catalog.mjs';

const { CLOUDFLARE_ACCOUNT_ID: accountId, CLOUDFLARE_API_TOKEN: token } = process.env;
if (!accountId || !token) throw new Error('Cloudflare account ID and API token are required');

const endpoint = 'https://api.cloudflare.com/client/v4/accounts/' + accountId + '/d1/database/' + databaseId + '/query';
async function query(body) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(45_000),
  });
  const payload = await response.json();
  if (!response.ok || !payload.success || payload.result.some(item => !item.success)) {
    throw new Error('D1 rejected catalog publication (HTTP ' + response.status + ')');
  }
  return payload.result;
}

await query({ batch: statements() });
const [{ results: [totals] }] = await query({ sql: countsQuery });
console.log(JSON.stringify(totals, null, 2));
