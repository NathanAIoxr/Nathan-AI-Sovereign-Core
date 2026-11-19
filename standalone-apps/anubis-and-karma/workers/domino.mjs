import { escapeHTML, frame, html, json, release, site, urls } from './shared.mjs';

const order = [
  { id: 'anubis', label: 'The Scales of Anubis', binding: 'ANUBIS', path: '/api/entry', entry: 0 },
  { id: 'karma', label: 'The Karma Balance Sheet', binding: 'KARMA', path: '/api/entry', entry: 1 },
  { id: 'finale', label: 'The playable finale', binding: 'FINALE', path: '/api/release' },
  { id: 'github', label: 'GitHub release manifest', manifest: true },
];

const neighbors = [
  { id: 'world', label: 'Tabor World' },
  { id: 'heka', label: 'Tabor Heka' },
  { id: 'pocket', label: 'Nathan AI Pocket Codex' },
];

const isRelease = (record) => record?.id === release.id
  && record?.version === release.version
  && record?.entries?.length === release.entries.length
  && release.entries.every((entry, i) => entry.id === record.entries[i]?.id)
  && record?.premise === release.premise;

async function check(item, env, external) {
  const init = { signal: AbortSignal.timeout(3500), redirect: 'error', cache: 'no-store' };
  if (item.binding) {
    const address = urls[item.id];
    const response = await env[item.binding].fetch(new Request(address + '/api/health', init));
    if (!response.ok) return false;
    const health = await response.json();
    if (!(health.ok && health.service === item.id && health.version === release.version)) return false;
    const content = await env[item.binding].fetch(new Request(address + item.path, init));
    if (!content.ok) return false;
    const record = await content.json();
    return item.entry === undefined ? isRelease(record) : record.id === release.entries[item.entry].id;
  }
  const response = await external(item.manifest ? urls.manifest : urls[item.id] + '/', {
    ...init, method: item.manifest ? 'GET' : 'HEAD',
  });
  return response.ok && (!item.manifest || isRelease(await response.json()));
}

async function inspect(item, env, external) {
  const row = { id: item.id, label: item.label, url: urls[item.id] };
  try {
    return { ...row, status: await check(item, env, external) ? 'verified' : 'needs attention' };
  } catch {
    return { ...row, status: 'needs attention' };
  }
}

export async function verifyRelease(env, external = fetch) {
  const stages = [];
  let ready = true;
  for (const item of order) {
    const result = ready
      ? await inspect(item, env, external)
      : { id: item.id, label: item.label, url: urls[item.id], status: 'waiting on previous step' };
    stages.push(result);
    ready &&= result.status === 'verified';
  }
  const related = ready ? await Promise.all(neighbors.map((item) => inspect(item, env, external))) : [];
  return { ready, version: release.version, checkedAt: new Date().toISOString(), stages, related };
}

const list = (items) => items.map((item) =>
  `<li><a href="${escapeHTML(item.url)}">${escapeHTML(item.label)}</a><small${item.status === 'verified' ? ' class="pass"' : ''}>${escapeHTML(item.status)}</small></li>`,
).join('');

const worker = site('domino', async (path, request, env) => {
  if (!['/', '/api/chain'].includes(path)) return;
  const report = await verifyRelease(env);
  if (path === '/api/chain') return json(request, report, report.ready ? 200 : 503);
  return html(request, frame('Domino', `
    <p class="overline">Tabor World / Release verification</p><h1>Domino</h1>
    <p class="intro">${report.ready ? 'All four release checks passed.' : 'The release has checks pending.'}</p>
    <ol class="domino-list">${list(report.stages)}</ol>
    <p class="credit">Checked <time datetime="${report.checkedAt}">${report.checkedAt}</time></p>
    ${report.related.length ? `<h2>Related projects</h2><p>Homepage availability</p><ul class="domino-list">${list(report.related)}</ul>` : ''}
    <a href="/api/chain">View JSON</a>`), report.ready ? 200 : 503);
});

export default {
  ...worker,
  async scheduled(_event, env) {
    const report = await verifyRelease(env);
    console.log(JSON.stringify({ event: 'tabor.domino.release-check', ...report }));
    if (!report.ready || report.related.some((item) => item.status !== 'verified')) {
      throw new Error('A Domino release check requires attention');
    }
  },
};
