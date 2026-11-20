import {storageReferences} from './trace-references.mjs';

const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', {fatal: true});
const quote = name => '"' + name.replaceAll('"', '""') + '"';

async function fingerprint(value) {
  const bytes = typeof value === 'string' ? encoder.encode(value) : value;
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

async function evidence(locator, value, parse) {
  let links = [];
  let state = 'binary';
  if (parse) {
    try {
      const text = typeof value === 'string' ? value : decoder.decode(value);
      if (text.includes('\0')) throw Error('Binary content');
      links = storageReferences(text);
      state = links.length ? 'references-found' : 'verified-leaf';
    } catch {
      // An opaque value supplies a content digest and no root claim.
    }
  }
  return {locator, state, sha256: await fingerprint(value), links};
}

export async function scanD1(request, account, database, table, options = {}) {
  const offset = options.offset ?? 0;
  const limit = options.limit ?? 100;
  const pages = options.pages ?? 1;
  if (![offset, limit, pages].every(Number.isSafeInteger) || offset < 0 || limit < 1 || limit > 250 || pages < 1 || pages > 100) throw Error('Invalid D1 scan range');
  if (!/^[0-9a-f-]{36}$/i.test(database) || !table || /^sqlite_|^_cf_|^zone_reader_/i.test(table)) throw Error('Invalid D1 source');
  const path = '/accounts/' + account + '/d1/database/' + database + '/query';
  async function query(sql, params) {
    const answer = await request({method:'POST', path, body:{sql, params}});
    if (!answer.success || !answer.result[0]?.success) throw Error('D1 read failed');
    return answer.result[0].results;
  }
  const columns = await query('SELECT name,pk FROM pragma_table_info(?) ORDER BY cid', [table]);
  if (!columns.length) throw Error('D1 table does not exist');
  const primary = columns.filter(c => c.pk > 0).sort((a, b) => a.pk - b.pk).map(c => c.name);
  const rowid = ['_rowid_', 'rowid', 'oid'].find(alias => !columns.some(c => c.name.toLowerCase() === alias));
  if (!primary.length && !rowid) throw Error('D1 table has no available row identifier');
  const tableRef = 'd1://' + database + '/' + encodeURIComponent(table);
  const out = [];
  let next = offset;
  for (let page = 0; page < pages; page++) {
    const order = primary.length ? primary.map(quote).join(',') : rowid;
    const rows = await query('SELECT * FROM ' + quote(table) + ' ORDER BY ' + order + ' LIMIT ? OFFSET ?', [limit, next]);
    for (const row of rows) {
      const locator = tableRef + '/' + next++;
      out.push(await evidence(locator, JSON.stringify(row), true));
    }
    if (rows.length < limit) return {source:tableRef, records:out, next:null};
  }
  return {source:tableRef, records:out, next};
}

export async function scanStorage(request, account, source, options = {}) {
  const kind = source.kind;
  const limit = options.limit ?? 50;
  if (!['kv','r2'].includes(kind) || !Number.isSafeInteger(limit) || limit < (kind === 'kv' ? 10 : 1) || limit > 100) throw Error('Invalid storage scan range');
  const isKV = kind === 'kv';
  const base = '/accounts/' + account + (isKV ? '/storage/kv/namespaces/' : '/r2/buckets/') + encodeURIComponent(source.id);
  const page = await request({method:'GET', path:base + (isKV ? '/keys' : '/objects'),
    query:{[isKV ? 'limit' : 'per_page']:limit, cursor:options.cursor || undefined}});
  if (!page.success || !Array.isArray(page.result)) throw Error('Storage list failed');
  const root = kind + '://' + source.id;
  const records = [];
  let values;
  if (isKV && page.result.length) {
    const read = await request({method:'POST',path:base + '/bulk/get',body:{keys:page.result.map(item => item.name),type:'text'}});
    if (!read.success || !read.result?.values) throw Error('KV batch read failed');
    values = read.result.values;
  }
  async function readItem(item) {
    const key = item.name ?? item.key;
    const locator = root + '/' + await fingerprint(key);
    try {
      if (isKV) {
        const value = Object.hasOwn(values, key) ? values[key] : null;
        if (typeof value !== 'string') throw Error('KV key missing');
        return await evidence(locator, value, true);
      }
      if (item.size > (options.maximumObjectBytes ?? 262144)) {
        return {locator,state:'object-size-boundary',size:item.size,links:[]};
      }
      const value = await request({method:'GET',path:base + '/objects/' + encodeURIComponent(key)});
      if (typeof value === 'string' || value instanceof Uint8Array) {
        return await evidence(locator,value,true);
      }
      return await evidence(locator,JSON.stringify(value),true);
    } catch {
      return {locator,state:'read-error',links:[]};
    }
  }
  const items = isKV ? page.result : page.result.filter(item => !item.key.startsWith('reader-provenance/'));
  for (let start = 0; start < items.length; start += 6) {
    records.push(...await Promise.all(items.slice(start, start + 6).map(readItem)));
  }
  const next = page.result_info?.is_truncated === false ? null : page.result_info?.cursor || null;
  if (page.result_info?.is_truncated === true && !next) throw Error('Storage listing did not return its next cursor');
  return {source:root,records,next};
}
