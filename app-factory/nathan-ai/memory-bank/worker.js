const maxRecall = 50;
const maxImport = 40;
const maxBodyBytes = 512 * 1024;
const stopWords = new Set([
  'a', 'all', 'an', 'and', 'about', 'back', 'built', 'can', 'do', 'did', 'find', 'for',
  'from', 'get', 'give', 'have', 'i', 'in', 'look', 'me', 'my', 'of', 'on',
  'our', 'pull', 'recall', 'remember', 'show', 'tell', 'the', 'to', 'up', 'we',
  'what', 'when', 'where', 'which', 'with', 'you', 'your'
]);
const fields = 'id, category, title, content, tags, source_ai, created_at, updated_at';
const entryMatch = "category = ? AND title = ? AND content = ? AND coalesce(tags, '') = ? AND coalesce(source_ai, 'unknown') = ?";

class RequestError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function json(data, status = 200, headers = {}) {
  return Response.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff', ...headers }
  });
}

async function keyMatches(supplied, expected) {
  if (!supplied || !expected || supplied.length > 512) return false;
  const encoder = new TextEncoder();
  const [a, b] = await Promise.all([supplied, expected].map((value) =>
    crypto.subtle.digest('SHA-256', encoder.encode(value))
  ));
  const left = new Uint8Array(a);
  const right = new Uint8Array(b);
  let diff = 0;
  for (let i = 0; i < left.length; i++) diff |= left[i] ^ right[i];
  return diff === 0;
}

async function readJson(request, byteLimit = maxBodyBytes) {
  if (request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    throw new RequestError(415, 'Use Content-Type: application/json.');
  }
  if (!request.body) throw new RequestError(400, 'A JSON body is required.');
  const reader = request.body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let bytes = 0;
  let text = '';
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > byteLimit) {
        await reader.cancel().catch(() => {});
        throw new RequestError(413, 'The request exceeds ' + byteLimit / 1024 + ' KiB.');
      }
      text += decoder.decode(value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } catch (error) {
    if (error instanceof RequestError) throw error;
    throw new RequestError(400, 'The body must be valid UTF-8 JSON.');
  } finally {
    reader.releaseLock();
  }
}

function normalizeEntry(entry) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    throw new RequestError(400, 'Each entry must be a JSON object.');
  }
  function field(name, length, fallback) {
    const value = entry[name] ?? fallback;
    if (typeof value !== 'string' || value.length > length || value.includes('\0') || !value.isWellFormed()) {
      throw new RequestError(400, name + ' must be text up to ' + length + ' characters.');
    }
    return name === 'content' ? value : value.trim();
  }
  const category = field('category', 80, 'general') || 'general';
  const title = field('title', 240);
  const content = field('content', 12000);
  const tags = field('tags', 500, '');
  const source = field('source_ai', 80, 'unknown') || 'unknown';
  if (!title || !content.trim()) throw new RequestError(400, 'Title and content are required.');
  return [category, title, content, tags, source];
}

function insert(DB, values) {
  return DB.prepare(
    'INSERT INTO personal_intelligence (category, title, content, tags, source_ai) ' +
    'SELECT ?, ?, ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM personal_intelligence WHERE ' + entryMatch + ') RETURNING id'
  ).bind(...values, ...values);
}

async function remember(request, DB) {
  const values = normalizeEntry(await readJson(request));
  const [inserted, existing] = await DB.batch([
    insert(DB, values),
    DB.prepare('SELECT id FROM personal_intelligence WHERE ' + entryMatch + ' ORDER BY id LIMIT 1').bind(...values)
  ]);
  const id = inserted.results[0]?.id ?? existing.results[0]?.id;
  if (!Number.isSafeInteger(id) || id < 1) throw new RequestError(503, 'The save could not be verified. Retry the same entry.');
  const saved = inserted.results.length > 0;
  return json({ status: saved ? 'saved' : 'already_saved', id, title: values[1] }, saved ? 201 : 200);
}

async function importEntries(request, DB) {
  const body = await readJson(request);
  if (!Array.isArray(body?.entries) || body.entries.length < 1 || body.entries.length > maxImport) {
    throw new RequestError(400, 'Supply an entries array with 1–' + maxImport + ' records.');
  }
  const entries = body.entries.map((entry, index) => {
    try {
      return normalizeEntry(entry);
    } catch (error) {
      if (error instanceof RequestError) error.message = 'Entry ' + (index + 1) + ': ' + error.message;
      throw error;
    }
  });
  const results = await DB.batch(entries.map((entry) => insert(DB, entry)));
  const ids = results.flatMap((result) => result.results.map((row) => row.id));
  if (results.length !== entries.length || ids.length > entries.length ||
      ids.some((id) => !Number.isSafeInteger(id) || id < 1) || new Set(ids).size !== ids.length) {
    throw new RequestError(503, 'The import could not be verified. Retry the same batch.');
  }
  return json({ status: 'imported', received: entries.length, saved: ids.length, duplicates: entries.length - ids.length, ids });
}

function numberParam(params, name, fallback, max) {
  const raw = params.get(name);
  if (raw === null) return fallback;
  const value = Number(raw);
  if (!/^\d+$/.test(raw) || !Number.isSafeInteger(value) || value < 1 || value > max) {
    throw new RequestError(400, 'Invalid ' + name + '.');
  }
  return value;
}

async function recall(request, url, DB) {
  const params = url.searchParams;
  let query;
  if (request.method === 'POST') {
    if (url.search) throw new RequestError(400, 'Send search parameters in the JSON body.');
    query = await readJson(request, 4 * 1024);
    if (!query || typeof query !== 'object' || Array.isArray(query) ||
        Object.keys(query).some((name) => !['q', 'category', 'limit', 'before_id', 'conversation_id'].includes(name))) {
      throw new RequestError(400, 'Supply a JSON object with search fields.');
    }
    for (const [name, max] of [['limit', maxRecall], ['before_id', Number.MAX_SAFE_INTEGER]]) {
      if (Object.hasOwn(query, name) && (!Number.isSafeInteger(query[name]) || query[name] < 1 || query[name] > max)) {
        throw new RequestError(400, 'Invalid ' + name + '.');
      }
    }
  } else {
    for (const name of ['q', 'category', 'limit', 'before_id']) {
      if (params.getAll(name).length > 1) throw new RequestError(400, 'Supply ' + name + ' only once.');
    }
    query = {
      q: params.get('q') ?? '', category: params.get('category') ?? '',
      limit: numberParam(params, 'limit', 8, maxRecall),
      before_id: numberParam(params, 'before_id', null, Number.MAX_SAFE_INTEGER)
    };
  }
  const { q: rawQuestion = '', category: rawCategory = '', limit = 8, before_id: before = null } = query;
  if ([rawQuestion, rawCategory].some((text) => typeof text !== 'string' || !text.isWellFormed() || text.includes('\0'))) {
    throw new RequestError(400, 'Search and category must be well-formed text.');
  }
  const conversation = query.conversation_id;
  if (Object.hasOwn(query, 'conversation_id') &&
      (typeof conversation !== 'string' || !/^[a-zA-Z0-9-]{1,128}$/.test(conversation))) {
    throw new RequestError(400, 'Invalid conversation_id.');
  }
  const q = rawQuestion.trim();
  const category = rawCategory.trim();
  if (q.length > 300 || category.length > 80) throw new RequestError(400, 'Search text is too long.');
  const rawTerms = q.toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
  const meaningfulTerms = rawTerms.filter((word) => !stopWords.has(word));
  const terms = [...new Set(meaningfulTerms.length ? meaningfulTerms : rawTerms)];
  if (terms.length > 12) throw new RequestError(400, 'Use up to 12 search keywords.');
  const conditions = [];
  const values = [];
  if (category) {
    conditions.push('category = ? COLLATE NOCASE');
    values.push(category);
  }
  if (before !== null) {
    conditions.push('id < ?');
    values.push(before);
  }
  if (conversation) {
    conditions.push("category = 'chatgpt-history' AND source_ai = 'ChatGPT' AND instr(', ' || tags || ', ', ?) > 0");
    values.push(', conversation ' + conversation + ', ');
  }
  const searchable = "lower(category || ' ' || title || ' ' || content || ' ' || coalesce(tags, ''))";
  for (const term of terms.length ? terms : q ? [q.toLowerCase()] : []) {
    conditions.push('instr(' + searchable + ', ?) > 0');
    values.push(term);
  }
  const where = conditions.length ? ' WHERE ' + conditions.join(' AND ') : '';
  const { results } = await DB.prepare(
    'SELECT ' + fields + ' FROM personal_intelligence' + where + ' ORDER BY id DESC LIMIT ?'
  ).bind(...values, limit + 1).all();
  const memories = results.slice(0, limit);
  return json({
    count: memories.length,
    memories,
    next_before_id: results.length > limit ? memories.at(-1).id : null
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;
    if (pathname === '/' || pathname === '/app.js' || pathname === '/archive.js' || pathname === '/styles.css' || pathname === '/zones' || pathname === '/zones/') {
      const asset = await env.ASSETS.fetch(request);
      const headers = new Headers(asset.headers);
      headers.set('Content-Security-Policy', "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'");
      headers.set('Referrer-Policy', 'no-referrer');
      headers.set('X-Content-Type-Options', 'nosniff');
      return new Response(asset.body, { status: asset.status, headers });
    }
    if (pathname === '/health' && request.method === 'GET') return json({ status: 'ok' });

    const methods = { '/remember': ['POST'], '/recall': ['GET', 'POST'], '/import': ['POST'] }[pathname];
    if (!methods) return json({ error: 'Route not found.' }, 404);
    if (!methods.includes(request.method)) return json({ error: 'Method not allowed.' }, 405, { Allow: methods.join(', ') });

    const supplied = request.headers.get('Authorization')?.match(/^Bearer (\S+)$/i)?.[1];
    const authorized = await keyMatches(supplied, env.API_KEY) ||
      (pathname === '/recall' && await keyMatches(supplied, env.READ_API_KEY));
    if (!authorized) return json({ error: 'Unauthorized.' }, 401, { 'WWW-Authenticate': 'Bearer' });
    try {
      if (pathname === '/remember') return await remember(request, env.DB);
      if (pathname === '/import') return await importEntries(request, env.DB);
      return await recall(request, url, env.DB);
    } catch (error) {
      if (error instanceof RequestError) return json({ error: error.message }, error.status);
      return json({ error: 'Memory storage is unavailable. Retry shortly.' }, 503);
    }
  }
};
