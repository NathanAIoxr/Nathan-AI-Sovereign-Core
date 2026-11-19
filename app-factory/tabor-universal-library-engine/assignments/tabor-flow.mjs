const GITHUB = 'https://raw.githubusercontent.com/NathanAIoxr/Nathan-AI-Sovereign-Core/main/projects/find-the-tabor/public/';
const PAGES = 'https://nathanaioxr.github.io/Nathan-AI-Sovereign-Core/projects/find-the-tabor/public/';
const R2 = 'https://pub-75a950dc4e3b4f8cba13da7b7bceac9f.r2.dev/';
export const TABOR_CRON = '2-57/5 * * * *';
const EDITIONS = {
  lineage: 'Spellings and genealogy', silk: 'Silk Road Forward and Back', taborites: 'Taborites',
  knights: 'Knights of Tabor', daughters: 'Daughters of Tabor', light: 'Tabor Light',
  books: 'Books', apps: 'Apps', sites: 'Websites'
};
const COMMON = ['404.html', 'api/records.json', 'filters.js', 'health.json', 'index.html', 'style.css'];
const EXTRA = {
  silk: ['back/index.html'],
  books: ['download/before-the-first-road.md','download/series-bible.md',
    'read/before-the-first-road/index.html','read/series-bible/index.html']
};
const ALLOWED = new Set(Object.keys(EDITIONS).flatMap(id => [...COMMON, ...(EXTRA[id] ?? [])].map(path => id + '/' + path)));
const TYPES = {html:'text/html; charset=utf-8',js:'text/javascript; charset=utf-8',css:'text/css; charset=utf-8',json:'application/json',md:'text/markdown; charset=utf-8'};
const LIMIT = 512 * 1024;
const MAX_UPLOADS = 8;
const HEX = /^[a-f0-9]{64}$/;

export const assignments = [
  {phase:'Research', owner:'FIND THE TABOR weekly research task', next:'Advance one documented inquiry. Send public evidence and a specific next action to the edition that owns the question.'},
  {phase:'Source review', owner:'Curated Source Checks · GitHub Actions', next:'Record daily availability. Review a source and its exact locator before changing a historical finding.'},
  {phase:'Build', owner:'FIND THE TABOR Build · GitHub Actions', next:'Regenerate and test all nine editions. Compare the committed public files and release manifest.'},
  {phase:'Cloudflare sync', owner:'Library of Tabor Assignments · Cloudflare Worker', next:'Validate the public GitHub manifest and copy changed, verified files into the public R2 bucket.'},
  {phase:'Verify', owner:'Library of Tabor Assignments · Cloudflare Worker', next:'Check the stored bytes and compare the nine health records on GitHub Pages and Cloudflare. Record a receipt in D1.'}
];
const encode = value => new TextEncoder().encode(value);
const digest = async bytes => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)), n => n.toString(16).padStart(2,'0')).join('');

export async function parseManifest(data) {
  if (data?.schema !== 1 || !Array.isArray(data.files) || data.files.length !== ALLOWED.size || !HEX.test(data.release)) throw Error('Invalid release manifest');
  const seen = new Set();
  for (const file of data.files) {
    if (!ALLOWED.has(file.path) || seen.has(file.path) || !HEX.test(file.sha256) ||
        !Number.isSafeInteger(file.size) || file.size <= 0 || file.size > LIMIT) throw Error('Invalid release file');
    seen.add(file.path);
  }
  if (await digest(encode(JSON.stringify(data.files))) !== data.release) throw Error('Invalid release digest');
  return data;
}

async function readBody(response, limit) {
  if (!response.body) throw Error('Missing response bytes');
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    for (;;) {
      const {value,done} = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) throw Error('Unexpected asset size');
      chunks.push(value);
    }
  } finally {
    try { await reader.cancel(); } catch {}
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk,offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

async function download(url, limit) {
  const response = await fetch(url,{redirect:'error',signal:AbortSignal.timeout(8000),headers:{'Cache-Control':'no-cache'}});
  if (!response.ok) throw Error('Upstream HTTP ' + response.status);
  return readBody(response,limit);
}

async function matches(object, file) {
  if (!object) return false;
  if (object.size !== file.size) {
    await object.body.cancel();
    return false;
  }
  return await digest(await object.arrayBuffer()) === file.sha256;
}

async function publicHealth(files, release) {
  return Promise.all(Object.keys(EDITIONS).map(async id => {
    const row = files.find(file => file.path === id + '/health.json');
    async function check(base) {
      try {
        const bytes = await download(base + row.path + '?release=' + release, 2048);
        return await digest(bytes) === row.sha256;
      } catch { return false; }
    }
    const [github,cloudflare] = await Promise.all([check(PAGES),check(R2)]);
    return {id,github,cloudflare};
  }));
}

export async function syncTabor(env, when) {
  const db = env.TABOR_RESEARCH;
  const start = Date.now();
  const owner = crypto.randomUUID();
  const lease = await db.prepare('INSERT INTO publication_lease VALUES (1, ?, ?) ON CONFLICT(id) DO UPDATE SET owner = excluded.owner, expires = excluded.expires WHERE publication_lease.expires <= ?').bind(owner,start+240000,start).run();
  if (!lease.meta.changes) return;
  try { return await reconcile(env,when); }
  finally { await db.prepare('DELETE FROM publication_lease WHERE id = 1 AND owner = ?').bind(owner).run(); }
}

async function reconcile(env, when) {
  const checkedAt = new Date(when).toISOString();
  const db = env.TABOR_RESEARCH;
  const prior = await db.prepare('SELECT payload FROM publication_receipt WHERE id = 1').first();
  const previous = prior ? JSON.parse(prior.payload) : null;
  const record = {checkedAt, release:null, state:'fetching', total:ALLOWED.size, stored:0, uploaded:0, public:[]};
  try {
    const manifest = await parseManifest(JSON.parse(new TextDecoder().decode(await download(GITHUB+'release.json', 32 * 1024))));
    record.release = manifest.release;
    const {results} = await db.prepare('SELECT path, sha256 FROM publication_assets').all();
    const confirmed = new Map(results.map(row => [row.path,row.sha256]));
    const order = file => file.path.endsWith('/health.json') ? 2 : file.path.endsWith('.html') ? 1 : 0;
    const files = [...manifest.files].sort((a,b) => order(a)-order(b));
    let pending = files.filter(file => confirmed.get(file.path) !== file.sha256);
    if (!pending.length) pending = [files[Math.floor(when / 300000) % files.length]];
    const attestations = [];
    const problems = [];
    let attempts = 0;
    for (const file of pending) {
      try {
        if (!await matches(await env.TABOR_PUBLIC.get(file.path),file)) {
          confirmed.delete(file.path);
          if (attempts >= MAX_UPLOADS) {
            await db.prepare('DELETE FROM publication_assets WHERE path = ?').bind(file.path).run();
            break;
          }
          attempts++;
          const bytes = await download(GITHUB+file.path+'?release='+manifest.release,file.size);
          if (bytes.byteLength !== file.size || await digest(bytes) !== file.sha256) throw Error('Published bytes differ from release manifest');
          await env.TABOR_PUBLIC.put(file.path,bytes,{httpMetadata:{contentType:TYPES[file.path.split('.').at(-1)]},customMetadata:{sha256:file.sha256}});
          if (!await matches(await env.TABOR_PUBLIC.get(file.path),file)) throw Error('Stored bytes differ from release manifest');
          record.uploaded++;
        }
        attestations.push(db.prepare('INSERT INTO publication_assets VALUES (?, ?) ON CONFLICT(path) DO UPDATE SET sha256 = excluded.sha256').bind(file.path,file.sha256));
        confirmed.set(file.path,file.sha256);
      } catch (error) {
        confirmed.delete(file.path);
        attestations.push(db.prepare('DELETE FROM publication_assets WHERE path = ?').bind(file.path));
        problems.push({path:file.path,detail:error.message});
      }
      if (attestations.length === 15) await db.batch(attestations.splice(0));
    }
    if (attestations.length) await db.batch(attestations);
    record.stored = files.filter(file => confirmed.get(file.path) === file.sha256).length;
    record.state = problems.length ? 'attention' : 'syncing';
    if (problems.length) record.problems = problems;
    if (record.stored === record.total) {
      record.public = await publicHealth(files,manifest.release);
      record.state = record.public.every(row => row.github && row.cloudflare) ? 'verified' : 'awaiting-public-parity';
    }
  } catch (error) {
    record.state = 'attention';
    record.problems = [{detail:error.message}];
    if (previous?.state === 'verified') record.lastVerified = {checkedAt:previous.checkedAt,release:previous.release};
    else if (previous?.lastVerified) record.lastVerified = previous.lastVerified;
  }
  await db.prepare('INSERT INTO publication_receipt VALUES (1, ?, ?) ON CONFLICT(id) DO UPDATE SET tick = excluded.tick, payload = excluded.payload WHERE excluded.tick >= publication_receipt.tick')
    .bind(when,JSON.stringify(record)).run();
  return record;
}

const safe = value => String(value).replace(/[&<>"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'}[c]));
export async function taborFlow(path, env) {
  const row = await env.TABOR_RESEARCH.prepare('SELECT payload FROM publication_receipt WHERE id = 1').first();
  const receipt = row ? JSON.parse(row.payload) : null;
  if (path === '/api/find-the-tabor') return Response.json({project:'FIND THE TABOR',schedule:TABOR_CRON,assignments,receipt},{headers:{'Cache-Control':'no-store'}});
  const editions = Object.entries(EDITIONS).map(([id,title]) => `<li>${safe(title)} · <a href="${R2+id}/index.html">Cloudflare</a> · <a href="${PAGES+id}/index.html">GitHub</a></li>`).join('');
  const phases = assignments.map(({phase,owner,next}) => `<li><strong>${safe(phase)}</strong> · ${safe(owner)}<br>${safe(next)}</li>`).join('');
  return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>FIND THE TABOR · Assignments and flow</title><style>body{max-width:48rem;margin:3rem auto;padding:0 1.25rem;font:1.05rem/1.6 system-ui;background:#f8f3e6;color:#18332a}h1,h2{font-family:Georgia,serif}a{color:#296453}li{margin:.45rem 0}</style><main><h1>FIND THE TABOR</h1><p>Assignments and publication flow</p><p role="status">${receipt ? safe(receipt.state) + ' · ' + receipt.stored + '/' + receipt.total + ' files · ' + safe(receipt.checkedAt) : 'First scheduled check pending.'}</p><p><a href="/api/find-the-tabor">Latest receipt and assignments</a> · <a href="https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/tree/main/projects/find-the-tabor">GitHub source</a></p><h2>Assignments</h2><ol>${phases}</ol><h2>Editions</h2><ul>${editions}</ul></main></html>`,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'"}});
}
