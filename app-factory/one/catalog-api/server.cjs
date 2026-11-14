'use strict';
/**
 * ONE catalog gateway — server-to-server Airtable read adapter.
 * Distinct from ONE encrypted backup gateway. No originals, credentials, or
 * automatic synchronization flow through the public ONE browser app.
 * Node 20+; built-in modules only.
 */
const http = require('node:http');
const {createHash, timingSafeEqual} = require('node:crypto');

const BASE_PATTERN = /^app[A-Za-z0-9]{14}$/;
const TABLE_PATTERN = /^tbl[A-Za-z0-9]{14}$/;
const OFFSET_PATTERN = /^[A-Za-z0-9._~-]{1,256}$/;
const PUBLIC_FIELDS = Object.freeze([
  'Name', 'Canonical ID', 'Department', 'Kind', 'Build Status', 'Source URL'
]);

function send(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store, private',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer'
  });
  res.end(JSON.stringify(data));
}

function boundedText(value, max = 500) {
  return typeof value === 'string' ? value.slice(0, max) : '';
}

function createHandler({
  apiToken, airtableToken, baseId, tableId,
  fetchImpl = globalThis.fetch,
  timeoutMs = 8000
} = {}) {
  if (typeof apiToken !== 'string' || apiToken.length < 32 ||
      /^(replace|change|example|test|placeholder)/i.test(apiToken)) {
    throw Error('ONE_CATALOG_READ_TOKEN requires a unique 32+-character secret');
  }
  if (typeof airtableToken !== 'string' || airtableToken.length < 16 ||
      /^(replace|change|example|test|placeholder)/i.test(airtableToken)) {
    throw Error('AIRTABLE_TOKEN must be configured on the server');
  }
  if (!BASE_PATTERN.test(baseId || '') || !TABLE_PATTERN.test(tableId || '')) {
    throw Error('Configure valid Airtable base and table IDs');
  }
  if (typeof fetchImpl !== 'function') throw Error('A server-side fetch implementation is required');
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 30000) {
    throw Error('Invalid upstream timeout');
  }

  const expected = createHash('sha256').update(apiToken).digest();
  const authorized = req => {
    const h = req.headers.authorization || '';
    if (typeof h !== 'string' || !h.startsWith('Bearer ')) return false;
    const got = createHash('sha256').update(h.slice(7)).digest();
    return timingSafeEqual(got, expected);
  };

  return async function handler(req, res) {
    // This server is not a public client API. Never allow cross-origin browser calls.
    if (req.headers.origin) return send(res, 403, {error:'browser_origin_not_allowed'});
    if (req.method === 'GET' && req.url === '/healthz') {
      return send(res, 200, {status:'configured', mode:'private-read-only-catalog', synced:false});
    }
    if (!authorized(req)) return send(res, 401, {error:'not_authorized'});
    if (req.method !== 'GET') return send(res, 405, {error:'read_only'});
    if (typeof req.url !== 'string' || req.url.length > 1024) {
      return send(res, 400, {error:'invalid_request'});
    }
    let input;
    try {input = new URL(req.url, 'http://localhost');}
    catch {return send(res, 400, {error:'invalid_request'});}
    if (input.pathname !== '/v1/catalog') return send(res, 404, {error:'not_found'});
    const keys = [...input.searchParams.keys()];
    if (keys.some(k=>!['limit','offset'].includes(k)) ||
        new Set(keys).size !== keys.length) {
      return send(res, 400, {error:'unsupported_query'});
    }
    const rawLimit = input.searchParams.get('limit') ?? '50';
    if (!/^[1-9]\d{0,2}$/.test(rawLimit) || Number(rawLimit) > 100) {
      return send(res, 400, {error:'invalid_limit'});
    }
    const offset = input.searchParams.get('offset');
    if (offset !== null && !OFFSET_PATTERN.test(offset)) {
      return send(res, 400, {error:'invalid_offset'});
    }
    const apiUrl = new URL('https://api.airtable.com/v0/' + baseId + '/' + tableId);
    apiUrl.searchParams.set('pageSize', rawLimit);
    for (const field of PUBLIC_FIELDS) apiUrl.searchParams.append('fields[]',field);
    if (offset) apiUrl.searchParams.set('offset', offset);
    try {
      const upstream = await fetchImpl(apiUrl.toString(), {
        method:'GET', headers:{
          'Authorization':'Bearer ' + airtableToken,
          'Accept':'application/json'
        },
        signal:AbortSignal.timeout(timeoutMs),
        redirect:'error'
      });
      if (!upstream.ok) return send(res, 502, {error:'catalog_upstream_unavailable'});
      const body = await upstream.json();
      if (!body || !Array.isArray(body.records)) {
        return send(res, 502, {error:'catalog_upstream_invalid'});
      }
      const items = body.records.slice(0,100).map(rec=>{
        const f = rec && typeof rec.fields === 'object' && rec.fields ? rec.fields : {};
        return {
          record_id:boundedText(rec?.id,50),
          canonical_id:boundedText(f['Canonical ID'],128),
          name:boundedText(f.Name),
          department:boundedText(f.Department,128),
          kind:boundedText(f.Kind,128),
          status:boundedText(f['Build Status'],128),
          source_url:typeof f['Source URL']==='string' && /^https:\/\//.test(f['Source URL'])
            ? boundedText(f['Source URL'],1000):null
        };
      }).filter(item=>item.record_id && item.canonical_id);
      const next = typeof body.offset==='string' && OFFSET_PATTERN.test(body.offset)
        ? body.offset : null;
      return send(res, 200, {
        schema:'one.catalog.read.v1',source:'airtable',
        synced:false,count:items.length,items,next_offset:next
      });
    } catch {
      // No upstream response bodies, tokens or private record contents in errors/logs.
      return send(res, 502, {error:'catalog_upstream_unavailable'});
    }
  };
}

if (require.main === module) {
  const handler = createHandler({
    apiToken:process.env.ONE_CATALOG_READ_TOKEN,
    airtableToken:process.env.AIRTABLE_TOKEN,
    baseId:process.env.ONE_AIRTABLE_BASE_ID,
    tableId:process.env.ONE_AIRTABLE_TABLE_ID
  });
  const host = process.env.ONE_CATALOG_BIND || '127.0.0.1';
  if (!['127.0.0.1','::1'].includes(host)) {
    throw Error('Bind to loopback only; use an authenticated private gateway for remote access');
  }
  const port = Number(process.env.ONE_CATALOG_PORT || '8792');
  if (!Number.isSafeInteger(port) || port < 1 || port > 65535) throw Error('Invalid catalog port');
  http.createServer(handler).listen(port, host, ()=>console.log('ONE private read-only catalog ready'));
}

module.exports = {createHandler, PUBLIC_FIELDS};
