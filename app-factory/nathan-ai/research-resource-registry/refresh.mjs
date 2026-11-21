import { syncCloudflareInventory } from './sync-cloudflare.mjs';

const {
  CLOUDFLARE_ACCOUNT_ID: accountId,
  RESEARCH_REGISTRY_D1_ID: databaseId,
  CLOUDFLARE_API_TOKEN: token
} = process.env;

if (!accountId || !databaseId || !token) {
  throw new Error('Set CLOUDFLARE_ACCOUNT_ID, RESEARCH_REGISTRY_D1_ID, and CLOUDFLARE_API_TOKEN');
}

async function request({ method, path, query = {}, body }) {
  const url = new URL('https://api.cloudflare.com/client/v4' + path);
  for (const [name, value] of Object.entries(query)) {
    if (value !== undefined) url.searchParams.set(name, value);
  }
  const headers = { Authorization: 'Bearer ' + token };
  if (body) headers['Content-Type'] = 'application/json';
  const response = await fetch(url, {
    method, headers, body: body && JSON.stringify(body),
    redirect: 'error', signal: AbortSignal.timeout(30_000)
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    const detail = result.errors?.map(error => error.message).join(', ');
    throw new Error(method + ' ' + url.pathname + ' returned ' + response.status + (detail ? ': ' + detail : ''));
  }
  return result;
}

const report = await syncCloudflareInventory(request, accountId, databaseId);
console.log(JSON.stringify(report, null, 2));
if (report.some(row => row.error)) process.exitCode = 1;
