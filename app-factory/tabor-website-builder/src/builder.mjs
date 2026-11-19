import { escapeHtml, page, hero, section, cards, textBody, html, json } from './ui.mjs';
import { legacy, projectOrder } from './sites.mjs';
import { directoryLinks } from './aid.mjs';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const isSlug = value => typeof value === 'string' && value.length <= 85 && slugPattern.test(value);
const articlePath = (edition, slug) => '/edition/' + edition + '/article/' + slug + '.html';
const nav = [['The Conservative Voice', '/edition/conservative-voice'], ['Editorial desk', '/editor'], ['Projects', '/#projects']];
const readEdition = (env, id) => env.DB.prepare('SELECT id,title FROM editions WHERE id=?').bind(id).first();

const editorForm = `<p>Load recent articles by edition. Save a draft, publish, or withdraw an article.</p>
<form data-editor class="stacked" method="post" action="/editor">
<label>Publisher token<input name="token" type="password" autocomplete="off" required></label>
<label>Edition slug<input name="edition" value="conservative-voice" maxlength="85" required></label>
<div class="controls"><button type="button" class="secondary" data-load>Load editorial queue</button><button type="button" class="secondary" data-new>New article</button></div>
<div class="controls" data-queue></div>
<label>Article slug<input name="slug" maxlength="85" required></label>
<label>Title<input name="title" maxlength="160" required></label>
<label>Byline<input name="byline" maxlength="100" required></label>
<label>Article body<textarea name="body" maxlength="20000" required></textarea></label>
<label>Status<select name="status"><option value="draft">Draft</option><option value="published">Published</option><option value="withdrawn">Withdrawn</option></select></label>
<button type="submit">Save article</button><p class="status" data-editor-status role="status"></p>
</form>`;

const historical = `<div class="article"><p>Nathan Tabor started TheConservativeVoice.com in 2004. The original site offered a way for individual contributors and organizations to submit articles. The current builder uses a compact editorial queue and permanent article links.</p>
<ul><li><a href="${legacy['site-builder']}">CBN profile of Nathan Tabor and the original site</a></li>
<li><a href="https://townhall.com/author/nathantabor">Nathan Tabor’s columns at Townhall</a></li>
<li><a href="https://web.archive.org/web/*/http://www.theconservativevoice.com/">Wayback Machine capture search</a></li></ul></div>`;

function home(site) {
  return html(page(site, hero(site, '<a class="button" href="/edition/conservative-voice">Open The Conservative Voice</a>') +
    section('The Conservative Voice', historical) +
    section('Independent projects', cards(directoryLinks(projectOrder.filter(id => id !== site.id))), 'projects'), { nav }));
}

export async function readBuilder(site, env, path) {
  if (path === '/') return home(site);
  if (path === '/editor') return html(page(site, section('Editorial desk', editorForm), { title: 'Editorial desk', nav }));
  const legacyURL = path.match(/^\/article\/(\d+)\.html$/);
  if (legacyURL) {
    const oldArticle = 'http://www.theconservativevoice.com/article/' + legacyURL[1] + '.html';
    return html(page(site, section('Historical article ' + legacyURL[1], `<p><a href="https://web.archive.org/web/*/${oldArticle}">Look for the original in the Wayback Machine</a></p>`), { nav }));
  }
  const match = path.match(/^\/edition\/([a-z0-9-]+)(?:\/article\/([a-z0-9-]+)\.html)?$/);
  if (!match) return null;
  const [, editionId, slug] = match;
  const edition = await readEdition(env, editionId);
  if (!edition) return null;
  if (!slug) {
    const { results } = await env.DB.prepare(`SELECT slug,title,byline FROM pages WHERE edition=? AND status='published'
      ORDER BY updated_at DESC,id DESC LIMIT 100`).bind(editionId).all();
    const articles = cards(results.map(article => ({
      title: article.title, description: article.byline, href: articlePath(editionId, article.slug), action: 'Read article',
    })));
    return html(page(site, hero({ ...site, headline: edition.title, description: 'Columns and archive records.', line: 'TABOR WEBSITE BUILDER' }) +
      section('Published articles', results.length ? articles : '<p>No published articles yet.</p>') +
      (editionId === 'conservative-voice' ? section('Archive sources', historical) : ''), { title: edition.title, nav }));
  }
  const article = await env.DB.prepare(`SELECT id,title,byline,revision FROM pages WHERE edition=? AND slug=? AND status='published'`)
    .bind(editionId, slug).first();
  if (!article) return null;
  const cacheKey = `article:${article.id}:${article.revision}`;
  let body = env.PAGE_CACHE ? await env.PAGE_CACHE.get(cacheKey).catch(() => null) : null;
  if (body === null) {
    const row = await env.DB.prepare('SELECT body FROM pages WHERE id=? AND revision=? AND status=\'published\'')
      .bind(article.id, article.revision).first();
    if (!row) return null;
    body = row.body;
    if (env.PAGE_CACHE) await env.PAGE_CACHE.put(cacheKey, body, { expirationTtl: 3600 }).catch(() => {});
  }
  return html(page(site, section(article.title, `<article class="article"><p class="eyebrow">${escapeHtml(article.byline)}</p>${textBody(body)}</article>
    <p><a href="/edition/${editionId}">Back to ${escapeHtml(edition.title)}</a></p>`), { title: article.title, nav }));
}

export async function manageBuilder(env, path, input) {
  if (path === '/api/editions') {
    const { id, title } = input;
    if (!isSlug(id) || typeof title !== 'string' || !title.trim() || title.length > 160) return json({ error: 'Invalid edition' }, 400);
    await env.DB.prepare('INSERT INTO editions(id,title) VALUES(?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title').bind(id, title.trim()).run();
    return json({ id, title: title.trim() });
  }
  const { edition, slug, title, byline, body, status, id, revision } = input;
  if (!isSlug(edition) || !isSlug(slug) || !['draft', 'published', 'withdrawn'].includes(status) ||
    ![[title,160],[byline,100],[body,20000]].every(([value, max]) => typeof value === 'string' && value.trim() && value.length <= max) ||
    !((id == null && revision == null) || (Number.isSafeInteger(id) && id > 0 && Number.isSafeInteger(revision) && revision > 0))) {
    return json({ error: 'Invalid article fields' }, 400);
  }
  if (!await readEdition(env, edition)) return json({ error: 'Edition not found' }, 404);
  const values = [title.trim(), byline.trim(), body, status, Date.now()];
  const record = id == null
    ? await env.DB.prepare(`INSERT INTO pages(edition,slug,title,byline,body,status,updated_at) VALUES(?,?,?,?,?,?,?)
        ON CONFLICT(edition,slug) DO NOTHING RETURNING id,revision`).bind(edition, slug, ...values).first()
    : await env.DB.prepare(`UPDATE pages SET title=?,byline=?,body=?,status=?,updated_at=?,revision=revision+1
        WHERE id=? AND edition=? AND slug=? AND revision=? RETURNING id,revision`)
      .bind(...values, id, edition, slug, revision).first();
  if (!record) return json({ error: 'The slug exists, the edition or slug changed, or someone saved a newer revision. Load the editorial queue.' }, 409);
  return json({ ...record, status, path: articlePath(edition, slug) });
}

export async function editorialQueue(env, url) {
  const edition = url.searchParams.get('edition');
  if (!isSlug(edition) || !await readEdition(env, edition)) return json({ error: 'Edition not found' }, 404);
  const { results } = await env.DB.prepare(`SELECT id,slug,title,byline,body,status,revision FROM pages WHERE edition=?
    ORDER BY updated_at DESC,id DESC LIMIT 50`).bind(edition).all();
  return json({ articles: results });
}
