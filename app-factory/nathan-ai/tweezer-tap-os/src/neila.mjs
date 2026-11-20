const bytes = new TextEncoder();
export const genesis = '0'.repeat(64);
export async function digest(value) {
  const data = typeof value === 'string' ? value : JSON.stringify(value);
  const hash = await crypto.subtle.digest('SHA-256', bytes.encode(data));
  return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function eventSeal(values, sequence, previous) {
  const forward = await digest(['ALIEN_FORWARD', values]);
  const reverse = await digest(['NEILA_REVERSE', [...values].reverse(), forward]);
  const root = await digest(['NEILA_MERKLE_V1', sequence, previous, forward, reverse]);
  return { sequence, previous, forward, reverse, root, values };
}

export async function putOnce(bucket, key, value) {
  const body = JSON.stringify(value);
  const result = await bucket.put(key, body, {
    onlyIf: { etagDoesNotMatch: '*' },
    httpMetadata: { contentType: 'application/json' }
  });
  if (result === null && await (await bucket.get(key))?.text() !== body) {
    throw new Error('Immutable evidence conflict');
  }
  return key;
}

export async function travel(env, operation, bookmark) {
  if (!env.D1_TIME_TRAVEL_TOKEN || !env.CF_ACCOUNT_ID || !env.ZONE_DATABASE_ID) {
    throw new Error('Zone D1 Time Travel is unconfigured');
  }
  const url = `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/d1/database/${env.ZONE_DATABASE_ID}/time_travel/${operation}`;
  const response = await fetch(url, {
    method: operation === 'restore' ? 'POST' : 'GET',
    headers: { Authorization: 'Bearer ' + env.D1_TIME_TRAVEL_TOKEN, 'Content-Type': 'application/json' },
    body: bookmark ? JSON.stringify({ bookmark }) : undefined,
    signal: AbortSignal.timeout(8000)
  });
  const result = await response.json();
  if (!response.ok || !result.success || typeof result.result?.bookmark !== 'string') {
    throw new Error('Zone D1 Time Travel failed');
  }
  return result.result;
}
