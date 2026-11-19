import { collections, eras, passages, topics } from '../texts/catalog.mjs';
import { escapeHTML as safe, frame, json, release, reply, site, urls } from './shared.mjs';

const index = { eras, topics, passages, collections };
const catalog = { release: release.id, version: release.version, ...index };

async function summary() {
  const bytes = new TextEncoder().encode(JSON.stringify(index));
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  return {
    version: release.version,
    records: passages.length,
    collections: collections.length,
    sha256: [...digest].map((byte) => byte.toString(16).padStart(2, '0')).join(''),
  };
}

const htmlWithForm = (request, page) => {
  const policy = "default-src 'none'; style-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'";
  return reply(request, page, 'text/html; charset=utf-8', 200, { 'content-security-policy': policy });
};

function filters(params) {
  const era = params.get('era') ?? '';
  const topic = params.get('topic') ?? '';
  const query = (params.get('q') ?? '').trim().slice(0, 100);
  return { era: eras.includes(era) ? era : '', topic: topics.includes(topic) ? topic : '', query };
}

const normalize = (text) => text.normalize('NFD').replace(/\p{Mark}/gu, '').toLowerCase();

function results({ era, topic, query }) {
  const terms = normalize(query).split(/\s+/);
  return passages.filter((record) => {
    if (era && record.era !== era) return false;
    if (topic && record.topic !== topic) return false;
    const haystack = normalize([
      record.id, record.work, record.tradition, record.coordinate,
      record.language, record.topic, record.finding, record.source.publisher,
    ].join(' '));
    return terms.every((term) => haystack.includes(term));
  });
}

function options(values, current, empty) {
  return `<option value="">${empty}</option>` + values.map((value) =>
    `<option value="${safe(value)}"${value === current ? ' selected' : ''}>${safe(value)}</option>`,
  ).join('');
}

function recordCard(record) {
  return `<article class="text-record" id="${safe(record.id)}">
    <p class="overline">${safe(record.tradition)} · ${safe(record.era)}</p>
    <h3>${safe(record.work)}</h3><p class="credit">${safe(record.coordinate)} · ${safe(record.language)}</p>
    <p>${safe(record.finding)}</p>
    <p class="text-source"><a href="${safe(record.source.url)}">${safe(record.source.publisher)}</a> · ${safe(record.source.witness)}</p>
    <p class="text-topic">Theme · ${safe(record.topic)}</p></article>`;
}

function directory(current) {
  const matches = results(current);
  return frame('The Root of 0 and 1 · Text Index', `
    <h1>The Root of 0 and 1</h1>
    <p class="intro">Ancient to modern text index</p>
    <blockquote><p>${safe(release.rootDirective)}</p><cite>Nathan Tabor</cite></blockquote>
    <p><strong>0 = 0 · 1 = 1</strong></p>
    <p class="credit">1+1=2 Build · 1−1=0 Clear · 1×1=1 Integrate · 1÷1=1 Verify</p>
    <p>The evidence rule is 1 when the cited text or artifact supports the stated finding and 0 when it fails to establish it. A theme groups passages for comparison. Each finding is limited to its cited passage.</p>
    <p><a href="${urls.finale}/root">KJV conflict names and the ending</a> · <a href="/catalog.json" download>Download the JSON index</a></p>
    <form class="text-filters" action="/" method="get" aria-label="Filter the text index">
      <label>Search the index<input name="q" type="search" maxlength="100" value="${safe(current.query)}" placeholder="Text, name, or passage"></label>
      <label>Period<select name="era">${options(eras, current.era, 'All periods')}</select></label>
      <label>Theme<select name="topic">${options(topics, current.topic, 'All themes')}</select></label>
      <button type="submit">Search</button><a href="/">Clear</a>
    </form>
    <h2>Passages</h2><p>${matches.length} of ${passages.length} indexed records</p>
    <div class="text-records">${matches.length ? matches.map(recordCard).join('') : '<p>No passages match these filters.</p>'}</div>
    <h2 id="collections">Connected collections</h2>
    <ul class="domino-list">${collections.map((record) => `<li><a href="${safe(record.url)}">${safe(record.name)}</a><small>${safe(record.use)}</small></li>`).join('')}</ul>
  `);
}

export default site('texts', async (path, request) => {
  if (path === '/') return htmlWithForm(request, directory(filters(new URL(request.url).searchParams)));
  if (path === '/api/summary') return json(request, await summary());
  if (path === '/api/catalog') return json(request, catalog);
  if (path === '/catalog.json') {
    return reply(request, JSON.stringify(catalog, null, 2) + '\n', 'application/json; charset=utf-8', 200, {
      'content-disposition': 'attachment; filename="tabor-zero-one-texts.json"',
    });
  }
});
