const labels = {
  text_setting: 'Scripture set to music',
  retelling: 'Biblical retelling',
  allusion: 'Biblical allusion',
  thematic_parallel: 'Thematic comparison',
};

const headers = {
  'Cache-Control': 'no-store',
  'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
  'X-Content-Type-Options': 'nosniff',
};
const escape = value => String(value ?? '').replace(/[&<>"']/g, char =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const sourceLink = (url, title) => '<a href="' + escape(url) + '">' + escape(title) + '</a>';
const conductor = 'https://unified-operations-cockpit.nathantaboract.workers.dev/tabor-sites/conductor';
const batchSize = 50;

async function search(requestUrl, db) {
  const q = (requestUrl.searchParams.get('q') ?? '').trim();
  const relationship = requestUrl.searchParams.get('relationship') || '';
  const page = Number(requestUrl.searchParams.get('page') || 1);
  if (q.length > 160 || (relationship && !Object.hasOwn(labels, relationship)) ||
      !Number.isInteger(page) || page < 1 || page > 10_000) return null;
  const term = '%' + q.replace(/[!%_]/g, '!$&') + '%';
  const { results } = await db.prepare(`WITH matches AS (
    SELECT r.* FROM recordings r
    WHERE (?1 = '' OR r.title LIKE ?2 ESCAPE '!' OR r.artist LIKE ?2 ESCAPE '!'
      OR r.theme LIKE ?2 ESCAPE '!' OR r.genre LIKE ?2 ESCAPE '!' OR EXISTS (
        SELECT 1 FROM comparisons c JOIN passages p ON p.id = c.passage_id
        WHERE c.recording_id = r.id AND p.reference LIKE ?2 ESCAPE '!'
          AND (?3 = '' OR c.relationship = ?3)))
      AND (?3 = '' OR EXISTS (SELECT 1 FROM comparisons c
        WHERE c.recording_id = r.id AND c.relationship = ?3))
    ORDER BY r.year IS NULL, r.year, r.title, r.id LIMIT ?4 OFFSET ?5
  )
  SELECT m.*,
    (SELECT json_group_array(json_object('name', name, 'url', url, 'role', role))
       FROM (SELECT s.name, s.url, rs.role FROM recording_sources rs JOIN sources s ON s.id = rs.source_id
        WHERE rs.recording_id = m.id ORDER BY rs.role, s.name)) AS sources,
    (SELECT json_group_array(json_object('reference', reference, 'url', url, 'relationship', relationship,
       'rationale', rationale, 'evidence', evidence))
       FROM (SELECT p.reference, s.url, c.relationship, c.rationale, e.url AS evidence
        FROM comparisons c JOIN passages p ON p.id = c.passage_id
        JOIN sources s ON s.id = p.source_id JOIN sources e ON e.id = c.evidence_source_id
        WHERE c.recording_id = m.id AND (?3 = '' OR c.relationship = ?3)
        ORDER BY p.reference)) AS passages
  FROM matches m ORDER BY m.year IS NULL, m.year, m.title, m.id`)
    .bind(q, term, relationship, batchSize + 1, (page - 1) * batchSize).all();
  const recordings = results.slice(0, batchSize).map(row => ({
    ...row, sources: JSON.parse(row.sources), passages: JSON.parse(row.passages),
  }));
  return { q, relationship, page, next_page: results.length > batchSize ? page + 1 : null, recordings };
}

const renderRecording = item => `<article><h2>${escape(item.title)}</h2>
<p class="meta">${escape(item.artist)} · ${escape(item.year ? item.year + ' ' + item.year_kind : 'Date open')} · ${escape(item.genre)}</p>
<p>${escape(item.version)}</p><p><strong>${escape(item.theme)}.</strong> ${escape(item.note)}</p>
${item.passages.length ? '<ul>' + item.passages.map(link => '<li><strong>' + escape(labels[link.relationship]) +
  '</strong> · ' + sourceLink(link.url, link.reference + ' (KJV)') + ' · ' + escape(link.rationale) +
  ' · ' + sourceLink(link.evidence, 'Evidence') + '</li>').join('') + '</ul>' : ''}
<details><summary>Recording and research sources</summary><ul>${item.sources.map(source =>
  '<li>' + sourceLink(source.url, source.name) + ' · ' + escape(source.role) + '</li>').join('')}</ul></details></article>`;

function renderIndex(result) {
  const pageUrl = page => '/?' + new URLSearchParams({ q: result.q, relationship: result.relationship, page });
  const options = Object.entries(labels).map(([key, label]) => '<option value="' + key + '"' +
    (key === result.relationship ? ' selected' : '') + '>' + label + '</option>').join('');
  const pagination = (result.page > 1 ? '<a href="' + escape(pageUrl(result.page - 1)) + '">Previous</a>' : '') +
    (result.next_page ? '<a href="' + escape(pageUrl(result.next_page)) + '">Next</a>' : '');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Tabor Song &amp; KJV Index</title><style>
:root{color-scheme:dark;background:#15171b;color:#f3ead9;font:1rem/1.55 system-ui,sans-serif}
body{max-width:58rem;margin:auto;padding:1.1rem}h1,h2{font-family:Georgia,serif;line-height:1.16}h1{font-size:clamp(2rem,6vw,3.7rem);margin:.6em 0 .25em}
h2{font-size:1.45rem;margin:0}a{color:#f2cc88}form{display:flex;flex-wrap:wrap;gap:.75rem;align-items:end;margin:1.3rem 0}
label{display:grid;gap:.2rem}input,button,select{font:inherit;background:#24272e;color:inherit;padding:.54rem .65rem;border:1px solid #9b8f7a;border-radius:4px}
button{cursor:pointer}article{border-top:1px solid #4d4b45;padding:1rem 0}article p{margin:.22rem 0}.meta{color:#d7c9b4}
ul{padding-left:1.35rem}nav{display:flex;gap:1rem;flex-wrap:wrap}details{margin:.55em 0}summary{cursor:pointer}
</style></head><body><main><h1>Tabor Song &amp; KJV Index</h1>
<p>Search recordings, themes and Bible passages. Open a source to check a recording or comparison.</p>
<nav><a href="/api/handoff">Conductor handoff</a><a href="${conductor}">Nathan AI Conductor</a><a href="/api/recordings">JSON catalog</a></nav>
<form method="get"><label>Search<input name="q" maxlength="160" value="${escape(result.q)}" placeholder="Artist, title, theme, KJV reference"></label>
<label>Connection to the KJV<select name="relationship"><option value="">All recordings</option>${options}</select></label><button>Search</button></form>
<p>${result.recordings.length} result${result.recordings.length === 1 ? '' : 's'} on this page</p>
${result.recordings.map(renderRecording).join('')}
<nav aria-label="Result pages">${pagination}</nav></main></body></html>`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const send = (data, status = 200, type = 'application/json', extra = {}) => new Response(
      request.method === 'HEAD' ? null : type === 'application/json' ? JSON.stringify(data) : data,
      { status, headers: {...headers, 'Content-Type': type + '; charset=utf-8', ...extra} });
    if (!['GET', 'HEAD'].includes(request.method)) return send({error: 'read_only'}, 405, 'application/json', {Allow:'GET, HEAD'});
    try {
      if (url.pathname === '/api/health') {
        const counts = await env.CATALOG.prepare(`SELECT COUNT(*) AS recordings,
          (SELECT COUNT(*) FROM comparisons) AS comparisons FROM recordings`).first();
        return send({ ready: counts.recordings > 0, release: env.RELEASE_SHA, ...counts }, counts.recordings > 0 ? 200 : 503);
      }
      if (url.pathname === '/api/handoff') {
        const row = await env.LEDGER.prepare(`SELECT details FROM conductor_events
          WHERE event = 'project_handoff_received' AND job_id = 'song-bible-index'
          ORDER BY created_at DESC, event_id DESC LIMIT 1`).first();
        return row ? send(JSON.parse(row.details)) : send({error: 'handoff_pending'}, 404);
      }
      if (url.pathname !== '/' && url.pathname !== '/api/recordings') return send({error: 'not_found'}, 404);
      const result = await search(url, env.CATALOG);
      if (!result) return send({error: 'invalid_search'}, 400);
      return url.pathname === '/' ? send(renderIndex(result), 200, 'text/html') : send(result);
    } catch (error) {
      console.error('Song index request failed', url.pathname, error instanceof Error ? error.message : '');
      return send({error: 'temporarily_unavailable'}, 503);
    }
  },
};
