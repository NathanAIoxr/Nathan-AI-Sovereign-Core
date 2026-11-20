import { consumeBatch } from './pull-consumer.mjs';

const { CF_ACCOUNT_ID, CF_API_TOKEN, READER_QUEUE_ID, READER_RECEIPTS_DB_ID } = process.env;
if (!/^[0-9a-f]{32}$/.test(CF_ACCOUNT_ID ?? '') ||
    !/^[0-9a-f]{32}$/.test(READER_QUEUE_ID ?? '') ||
    !/^[0-9a-f-]{36}$/.test(READER_RECEIPTS_DB_ID ?? '') || !CF_API_TOKEN) {
  throw new Error('Set Cloudflare account, queue, receipt database and API credential');
}
const root = 'https://api.cloudflare.com/client/v4/accounts/' + CF_ACCOUNT_ID;
async function request(path, body) {
  const response = await fetch(root + path, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + CF_API_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(5000)
  });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error('Cloudflare request failed with status ' + response.status);
  return result.result;
}
const result = await consumeBatch(request,
  '/queues/' + READER_QUEUE_ID, '/d1/database/' + READER_RECEIPTS_DB_ID + '/query');
console.log(JSON.stringify(result));
