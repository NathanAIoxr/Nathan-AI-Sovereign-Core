const kinds = ['worker', 'bot', 'agent'];
const columns = 'record_key, kind, title, location, source_ref, state, provenance, updated_at';

function result(body, status = 200) {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }
  });
}

async function validKey(request, expected) {
  const key = request.headers.get('Authorization')?.match(/^Bearer (\S{1,512})$/i)?.[1];
  if (!expected || !key) return false;
  const encode = new TextEncoder();
  const [left, right] = await Promise.all([key, expected].map(async value =>
    new Uint8Array(await crypto.subtle.digest('SHA-256', encode.encode(value)))));
  let difference = 0;
  for (let index = 0; index < left.length; index++) difference |= left[index] ^ right[index];
  return difference === 0;
}

async function list(url, db) {
  const kind = url.searchParams.get('kind') ?? '';
  const state = url.searchParams.get('state') ?? '';
  const after = url.searchParams.get('after') ?? '';
  const q = (url.searchParams.get('q') ?? '').trim();
  if ((kind && !kinds.includes(kind)) || (state && !['declared', 'observed', 'missing'].includes(state))
      || (after && !/^[a-z0-9:_-]{1,200}$/.test(after)) || q.length > 96) {
    return result({ error: 'Invalid registry filter.' }, 400);
  }
  const filters = ['record_key > ?'];
  const values = [after];
  if (kind) {
    filters.push('kind = ?');
    values.push(kind);
  }
  if (state) {
    filters.push('state = ?');
    values.push(state);
  }
  if (q) {
    filters.push("instr(lower(title || ' ' || location || ' ' || record_key), lower(?)) > 0");
    values.push(q);
  }
  const [page, totals] = await db.batch([
    db.prepare('SELECT ' + columns + ' FROM owned_runtime_registry WHERE ' + filters.join(' AND ')
      + ' ORDER BY record_key LIMIT 51').bind(...values),
    db.prepare('SELECT kind, state, total FROM owned_runtime_counts WHERE total > 0 ORDER BY kind, state')
  ]);
  const records = page.results.slice(0, 50);
  return result({ records, totals: totals.results, next: page.results.length > 50 ? records.at(-1).record_key : null });
}

async function register(request, db) {
  if (request.headers.get('Content-Type')?.split(';')[0].trim() !== 'application/json') {
    return result({ error: 'Use application/json.' }, 415);
  }
  if (!request.body) return result({ error: 'A JSON body is required.' }, 400);
  const reader = request.body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let raw = '';
  let bytes = 0;
  let input;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 4096) {
        await reader.cancel();
        return result({ error: 'Request exceeds 4 KiB.' }, 413);
      }
      raw += decoder.decode(value, { stream: true });
    }
    input = JSON.parse(raw + decoder.decode());
  } catch {
    return result({ error: 'Invalid JSON body.' }, 400);
  } finally {
    reader.releaseLock();
  }
  const { kind, slug, title, location = '', source_ref = '' } = input ?? {};
  const text = (v, max) => typeof v === 'string' && v.length <= max && !/\p{Cc}/u.test(v);
  if (!kinds.includes(kind) || typeof slug !== 'string' || !/^[a-z0-9][a-z0-9_-]{0,79}$/.test(slug)
      || !text(title, 128) || !title.trim() || !text(location, 160) || !text(source_ref, 400)) {
    return result({ error: 'Provide kind, slug and title. Location and source reference are optional.' }, 400);
  }
  const key = kind + ':owner:' + slug;
  await db.prepare(`INSERT INTO owned_runtime_registry
    (record_key, kind, title, location, source_ref, state, provenance) VALUES (?, ?, ?, ?, ?, 'declared', 'owner')
    ON CONFLICT(record_key) DO UPDATE SET title=excluded.title, location=excluded.location,
      source_ref=excluded.source_ref, updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')`)
    .bind(key, kind, title.trim(), location.trim(), source_ref.trim()).run();
  return result({ record_key: key, state: 'declared' });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (path === '/health' && request.method === 'GET') return result({ status: 'ok' });
    if (['/', '/app.js', '/styles.css'].includes(path) && request.method === 'GET') {
      const { body, type } = assets[path];
      return new Response(body, { headers: {
        'Content-Type': type,
        'Content-Security-Policy': "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
        'Referrer-Policy': 'no-referrer',
        'X-Content-Type-Options': 'nosniff'
      } });
    }
    if (path !== '/records') return result({ error: 'Route not found.' }, 404);
    if (!['GET', 'POST'].includes(request.method)) return result({ error: 'Method not allowed.' }, 405);
    if (!await validKey(request, env.REGISTRY_KEY)) return result({ error: 'Unauthorized.' }, 401);
    try {
      return request.method === 'GET' ? await list(url, env.DB) : await register(request, env.DB);
    } catch {
      return result({ error: 'Registry unavailable.' }, 503);
    }
  }
};
