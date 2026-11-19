import { project, navigation, records, manuscripts, css } from './content.mjs';

const escape = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[char]);
const normalize = text => text.normalize('NFKD').replace(/\p{Mark}/gu, '').toLowerCase();
const htmlHeaders = {
  'Content-Type': 'text/html; charset=utf-8',
  'Content-Security-Policy': "default-src 'none'; style-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Content-Type-Options': 'nosniff'
};
const statuses = [...new Set(records.map(item => item.status))];

function shell(title, body) {
  const links = navigation.map(({title, link, active}) =>
    `<a href="${escape(link)}"${active ? ' aria-current="page"' : ''}>${escape(title)}</a>`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)}</title><link rel="stylesheet" href="/style.css"></head><body><header><nav aria-label="FIND THE TABOR projects">${links}</nav></header><main>${body}<footer>FIND THE TABOR · Nathan Tabor · <a href="https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/tree/codex/find-the-tabor-evidence-20261119/projects/find-the-tabor">Project source</a></footer></main></body></html>`;
}

function card(record) {
  const links = record.links.map(([name, url]) =>
    `<li><a href="${escape(url)}">${escape(name)}</a></li>`).join('');
  return `<li id="${escape(record.id)}"><span class="status">${escape(record.status)}</span><h2>${escape(record.title)}</h2><p>${escape(record.note)}</p>${links ? `<ul class="sources">${links}</ul>` : ''}</li>`;
}

function silkRoute(direction) {
  const regions = ['East Asia', 'Central Asia', 'Iran and the Caspian comparisons', 'Anatolia and the eastern Mediterranean'];
  const proposed = ['Ṭabarestān', 'Galilee', 'Anatolia', 'Bohemia', 'France and England'];
  if (direction === 'back') {
    regions.reverse();
    proposed.reverse();
  }
  return `<section class="route" aria-label="Route comparison"><p><strong>Historical network anchors</strong> · ${regions.join(' → ')}</p><p><strong>Author’s comparison sequence</strong> · ${proposed.join(' → ')}</p></section>`;
}

function render(url) {
  const query = url.searchParams.get('q')?.slice(0, 200).trim() ?? '';
  const status = url.searchParams.get('status') ?? '';
  const direction = url.searchParams.get('direction') === 'back' ? 'back' : 'forward';
  const filtered = records.filter(row =>
    (!status || row.status === status) &&
    (!query || normalize(`${row.title} ${row.note}`).includes(normalize(query))));
  const options = statuses.map(value =>
    `<option${status === value ? ' selected' : ''}>${escape(value)}</option>`).join('');
  const isSilk = project.id === 'silk';
  const directionPicker = isSilk ? `<label>Direction<select name="direction"><option value="forward">Forward · east to west</option><option value="back"${direction === 'back' ? ' selected' : ''}>Back · west to east</option></select></label>` : '';
  const list = filtered.length ? `<ol class="records">${filtered.map(card).join('')}</ol>` : '<p>No matching records. Try a spelling or clear the filters.</p>';
  return shell(project.title, `<h1>${escape(project.title)}</h1><p class="intro">${escape(project.intro)}</p>${isSilk ? silkRoute(direction) : ''}<form method="get"><label>Search records<input type="search" name="q" maxlength="200" value="${escape(query)}"></label><label>Evidence status<select name="status"><option value="">All statuses</option>${options}</select></label>${directionPicker}<button>Apply</button><a href="/">Clear</a></form><p id="count">${filtered.length} of ${records.length} records · <a href="/api/records">JSON data</a></p>${list}`);
}

function handle(request) {
  const url = new URL(request.url);
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method not allowed', {status:405, headers:{Allow:'GET, HEAD'}});
  }
  const pathname = url.pathname;
  if (pathname === '/health') return Response.json({worker: project.worker, project: project.id, release: project.release, records: records.length});
  if (pathname === '/api/records') return Response.json({project: project.id, release: project.release, records});
  if (pathname === '/style.css') return new Response(css, {headers:{'Content-Type':'text/css; charset=utf-8','X-Content-Type-Options':'nosniff'}});
  const read = /^\/read\/([a-z-]+)$/.exec(pathname);
  const download = /^\/download\/([a-z-]+)\.md$/.exec(pathname);
  const slug = read?.[1] ?? download?.[1];
  if (slug && Object.hasOwn(manuscripts, slug)) {
    const [title, text] = manuscripts[slug];
    if (download) return new Response(text, {headers:{'Content-Type':'text/markdown; charset=utf-8','Content-Disposition':`attachment; filename="${slug}.md"`,'X-Content-Type-Options':'nosniff'}});
    return new Response(shell(title, `<a href="/">Back to books</a><h1>${escape(title)}</h1><a class="button" href="/download/${slug}.md">Download Markdown</a><article class="reader">${escape(text)}</article>`), {headers:htmlHeaders});
  }
  if (pathname === '/') return new Response(render(url), {headers:htmlHeaders});
  return new Response('Page not found', {status:404});
}

export default {
  fetch(request) {
    const response = handle(request);
    return request.method === 'HEAD' ? new Response(null, response) : response;
  }
};
