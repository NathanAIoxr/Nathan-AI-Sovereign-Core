export const archive = Object.freeze({
  id: 'nathan-tabor-labs-recovery-2026-11-20',
  sha256: 'e70413aeffd57c912328118c4aae71a2af8af29b103c7643d3754ad8d47ac075',
  bytes: 5849953,
  files: 284,
  key: 'lab-source-recovery/sha256/e70413aeffd57c912328118c4aae71a2af8af29b103c7643d3754ad8d47ac075.zip',
  handoff: 'https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/issues/523',
});

const pages = 'https://nathanaioxr.github.io/Nathan-AI-Sovereign-Core/app-factory/';
const minds = 'nathan-ai/personal-intelligence/minds/';
export const targets = Object.freeze({
  'cero-uno-dos': [pages + minds + 'index.html', 'Cero/Uno/Dos Atlas'],
  'mind-of-minds': [pages + minds + 'mind-of-minds/index.html', 'Personal Intelligence Mind Registry'],
  'attributes-atlas': [pages + 'nathan-ai/capability-atlas/index.html', 'Characteristics'],
  'acro-matrix': [pages + 'one/sovereign-acro-matrix/index.html', 'Sovereign Acro-Matrix'],
  'brainstormer': [pages + 'nathan-ai/brainstormer/index.html', 'The Brainstormer'],
  'mathematical-roots': [pages + 'stewie-mr-finn/Resources/PolarMiddleC/math-roots/index.html', '100 Mathematical Roots'],
  'mespark': [pages + 'one/mespark-memory-matrix/index.html', 'Universal Memory Matrix'],
  'fiber-matrix': ['https://tabor-fiber-track-baller.nathantaboract.workers.dev/', 'Fiber Matrix'],
});

const headers = { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' };
const json = (value, status = 200) => Response.json(value, { status, headers });
const hex = value => Array.from(new Uint8Array(value), byte => byte.toString(16).padStart(2, '0')).join('');
const digest = async bytes => hex(await crypto.subtle.digest('SHA-256', bytes));

async function authorized(request, token) {
  if (!token || token.length !== 64) return false;
  const provided = request.headers.get('authorization') ?? '';
  if (!/^Bearer [a-f0-9]{64}$/.test(provided)) return false;
  let difference = 0;
  for (let i = 0; i < token.length; i++) difference |= token.charCodeAt(i) ^ provided.charCodeAt(i + 7);
  return difference === 0;
}

async function upload(request, env) {
  if (!env.LAB_RECOVERY_IMPORT_TOKEN) return json({ error: 'not_found' }, 404);
  if (!await authorized(request, env.LAB_RECOVERY_IMPORT_TOKEN)) return json({ error: 'unauthorized' }, 401);
  if (request.headers.get('content-length') !== String(archive.bytes)) return json({ error: 'length_mismatch' }, 400);
  const bytes = await request.arrayBuffer();
  if (bytes.byteLength !== archive.bytes || await digest(bytes) !== archive.sha256) {
    return json({ error: 'archive_mismatch' }, 422);
  }
  const result = await env.LAB_ARCHIVE.put(archive.key, bytes, {
    onlyIf: { etagDoesNotMatch: '*' },
    httpMetadata: { contentType: 'application/zip' },
    customMetadata: { sha256: archive.sha256, handoff: archive.id },
  });
  const object = result ?? await env.LAB_ARCHIVE.head(archive.key);
  if (object?.size !== archive.bytes || object.customMetadata?.sha256 !== archive.sha256) {
    return json({ error: 'archive_conflict' }, 409);
  }
  await runRecovery(env, 'intake');
  return json({ archive: archive.id, sha256: archive.sha256, bytes: object.size, replay: !result }, result ? 201 : 200);
}

async function check(job, env) {
  if (job.id === 'archive-integrity') {
    const object = await env.LAB_ARCHIVE.get(archive.key);
    if (!object || object.size !== archive.bytes) throw Error('archive_missing_or_incomplete');
    if (await digest(await object.arrayBuffer()) !== archive.sha256) throw Error('readback_digest_mismatch');
    return { sha256: archive.sha256, bytes: archive.bytes, files: archive.files };
  }
  const target = targets[job.id];
  if (!target) throw Error('unregistered_launch');
  const response = await fetch(target[0], { redirect: 'error', signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw Error(`http_${response.status}`);
  const opening = await response.text();
  if (!opening.includes(target[1])) throw Error('launch_identity_mismatch');
  return { url: target[0], http: response.status, identity: target[1] };
}

export async function runRecovery(env, source = 'scheduled') {
  if (!env.LAB_BUILDS || !env.LAB_ARCHIVE) return;
  const db = env.LAB_BUILDS;
  const lease = crypto.randomUUID();
  const uploaded = Boolean(await env.LAB_ARCHIVE.head(archive.key));
  const { results } = await db.prepare(`UPDATE lab_recovery_jobs_v1
    SET status='running', lease_owner=?1, lease_until=unixepoch()+120, attempts=attempts+1, updated_at=unixepoch()
    WHERE kind IN ('integrity','launch') AND next_attempt<=unixepoch()
      AND (id<>'archive-integrity' OR ?2=1)
      AND (status='queued' OR (status='running' AND lease_until<=unixepoch()))
    RETURNING id,attempts`).bind(lease, Number(uploaded)).all();
  await Promise.all(results.map(async job => {
    let receipt, state;
    try {
      receipt = { ...await check(job, env), source };
      state = 'verified';
    } catch (error) {
      const message = error instanceof Error && /^(archive_missing_or_incomplete|readback_digest_mismatch|http_\d{3}|unregistered_launch|launch_identity_mismatch)$/.test(error.message)
        ? error.message : 'verification_unavailable';
      receipt = { error: message, source };
      state = job.attempts >= 4 ? 'blocked' : 'queued';
    }
    await db.prepare(`UPDATE lab_recovery_jobs_v1 SET status=?1, receipt=?2, lease_owner=NULL,
      lease_until=NULL, next_attempt=unixepoch()+900, updated_at=unixepoch()
      WHERE id=?3 AND lease_owner=?4 AND lease_until>unixepoch()`).bind(state, JSON.stringify(receipt), job.id, lease).run();
  }));
}

const page = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Nathan Tabor Labs · Source Recovery</title><style>body{font:17px/1.6 system-ui,sans-serif;color:#15293d;background:#f5f7f8;max-width:44rem;margin:auto;padding:2rem 1rem}a{color:#13577d}li{margin:.5rem 0}</style>
<h1>Nathan Tabor Labs</h1><h2>Source Recovery</h2><ul><li><a href="/api/recovery">Archive and Conductor receipts</a></li>
<li><a href="${archive.handoff}">GitHub Conductor handoff</a></li><li><a href="/play/labs">Player Edition</a></li><li><a href="/workbench">Workbench</a></li></ul></html>`;

export async function recoveryRoute(request, env) {
  const path = new URL(request.url).pathname;
  if (path === '/api/recovery/import') return request.method === 'POST' ? upload(request, env) : json({ error: 'not_found' }, 404);
  if (!['/recovery', '/recovery/', '/api/recovery'].includes(path)) return undefined;
  if (!['GET', 'HEAD'].includes(request.method)) return json({ error: 'method_not_allowed' }, 405);
  const isHead = request.method === 'HEAD';
  if (path !== '/api/recovery') return new Response(isHead ? null : page, {
    headers: { ...headers, 'content-type': 'text/html; charset=utf-8',
      'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'" },
  });
  const { results } = await env.LAB_BUILDS.prepare(`SELECT id,kind,title,status,attempts,updated_at,
    CASE WHEN kind IN ('integrity','launch') THEN receipt ELSE NULL END AS receipt
    FROM lab_recovery_jobs_v1 ORDER BY kind,id`).all();
  if (isHead) return new Response(null, { headers });
  const stored = results.find(job => job.id === 'archive-integrity')?.status === 'verified';
  return json({ id: archive.id, archive: { files: archive.files, bytes: archive.bytes, sha256: archive.sha256, verified: stored },
    handoff: archive.handoff, cron: '*/15 * * * *', jobs: results.map(job => ({ ...job, receipt: job.receipt ? JSON.parse(job.receipt) : null })) });
}

export function withLabRecovery(original) {
  return {
    ...original,
    async fetch(request, env, ctx) {
      return await recoveryRoute(request, env) ?? original.fetch(request, env, ctx);
    },
    async scheduled(event, env, ctx) {
      const results = await Promise.allSettled([original.scheduled(event, env, ctx), runRecovery(env)]);
      if (results.some(result => result.status === 'rejected')) throw Error('A scheduled Labs check failed');
    },
  };
}
