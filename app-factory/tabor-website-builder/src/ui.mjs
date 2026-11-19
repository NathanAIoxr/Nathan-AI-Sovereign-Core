export const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);

export const securityHeaders = {
  'content-security-policy': "default-src 'none'; style-src 'self'; script-src 'self'; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
  'referrer-policy': 'strict-origin-when-cross-origin',
  'x-content-type-options': 'nosniff',
};

export function html(body, status = 200) {
  return new Response(body, {
    status, headers: { ...securityHeaders, 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
  });
}

export function json(body, status = 200) {
  return Response.json(body, { status, headers: { ...securityHeaders, 'cache-control': 'no-store' } });
}

function link([label, href]) {
  return `<a href="${escapeHtml(href)}">${escapeHtml(label)}</a>`;
}

export function page(site, body, { title, nav = [], hideYear = false } = {}) {
  const brand = hideYear ? 'BEYOND THE CALENDAR' : site.title;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title || brand)}</title><link rel="stylesheet" href="/style.css"><script defer src="/site.js"></script></head>
<body class="${escapeHtml(site.theme)}"><a class="skip" href="#main">Skip to content</a><header class="top"><div class="wrap top-row"><a class="wordmark" href="${hideYear ? '/beyond' : '/'}">${escapeHtml(brand)}</a><nav aria-label="Main">${nav.map(link).join('')}</nav></div></header><main id="main">${body}</main><footer><div class="wrap">A Nathan Tabor project <span>·</span> TABOR WEBSITE BUILDER</div></footer></body></html>`;
}

export function hero(site, action = '', label = site.line) {
  return `<section class="hero"><div class="wrap hero-grid"><div><p class="eyebrow">${escapeHtml(label)}</p><h1>${escapeHtml(site.headline)}</h1><p class="lede">${escapeHtml(site.description)}</p>${action}</div><div class="emblem" aria-hidden="true"></div></div></section>`;
}

export function section(title, body, id = '') {
  return `<section class="wrap section"${id ? ` id="${escapeHtml(id)}"` : ''}><h2>${escapeHtml(title)}</h2>${body}</section>`;
}

export function cards(items) {
  return `<div class="cards">${items.map(({ title, label, description, href, action }) =>
    `<article class="card">${label ? `<p class="eyebrow">${escapeHtml(label)}</p>` : ''}<h3>${escapeHtml(title)}</h3><p>${escapeHtml(description)}</p>${href ? `<a class="more" href="${escapeHtml(href)}">${escapeHtml(action || 'Open site')} <span aria-hidden="true">↗</span></a>` : ''}</article>`).join('')}</div>`;
}

export function textBody(body) {
  return String(body).split(/\r?\n[\s\r\n]*\r?\n/).map(paragraph =>
    `<p>${escapeHtml(paragraph).replace(/\r?\n/g, '<br>')}</p>`).join('');
}

export const style = `
*{box-sizing:border-box}
:root{color-scheme:light;--paper:#f9f6ef;--card:#fffdf7;--ink:#142b23;--muted:#4e5b52;--edge:#cecfc0;--accent:#126246;--hero:#0b3b2b;--light:#f6d785;--motif:#9aa56b;--hero-text:#fff8e8;font:16px/1.58 "DM Sans",system-ui,sans-serif}
.blue{--accent:#205e72;--hero:#123b50;--light:#c8eef0;--motif:#508b91}
.brick{--accent:#933b2b;--hero:#57281e;--light:#ffdc94;--motif:#bd7658}
.ink{--accent:#2c455d;--hero:#172838;--light:#efd5a2;--motif:#667e92}
.night{--accent:#514286;--hero:#201939;--light:#e9d3fb;--motif:#88619c}
body{margin:0;background:var(--paper);color:var(--ink)}
a{color:var(--accent);text-underline-offset:.2em}
a:focus-visible,button:focus-visible,input:focus-visible,textarea:focus-visible,select:focus-visible{outline:3px solid #de812b;outline-offset:4px}
.wrap{max-width:1130px;margin:auto;padding-inline:clamp(20px,5vw,55px)}
.skip{position:absolute;top:-80px;left:15px;background:white;padding:10px;z-index:1}
.skip:focus{top:12px}
.top{background:var(--paper);border-bottom:1px solid var(--edge)}
.top-row,nav{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}
.top-row{min-height:68px;padding-block:14px}
nav{justify-content:flex-start}
nav a,.wordmark{font-weight:750;text-decoration:none}
nav a:hover,.wordmark:hover{text-decoration:underline}
.wordmark{color:var(--ink)}
.hero{background:var(--hero);color:var(--hero-text)}
.hero-grid{position:relative;display:grid;grid-template-columns:minmax(0,2fr) minmax(190px,1fr);align-items:center;gap:28px;padding-block:clamp(54px,9vw,120px)}
.hero h1,.section h2,.card h3{font-family:"DM Serif Text",Georgia,serif;font-weight:500;line-height:1.04}
.hero h1{font-size:clamp(2.9rem,7vw,6rem);letter-spacing:-.05em;margin:.13em 0 .22em;overflow-wrap:anywhere}
.eyebrow{font-size:.78rem;font-weight:800;text-transform:uppercase;letter-spacing:.09em;color:var(--accent);margin:0}
.hero .eyebrow{color:var(--light)}
.lede{font-size:clamp(1.05rem,2vw,1.32rem);max-width:36rem;margin:0 0 22px}
.emblem{justify-self:center;width:min(100%,255px);aspect-ratio:1;border-radius:50%;border:1px solid var(--motif);background:radial-gradient(circle at 50% 50%,var(--light) 0 10%,transparent 10.5%),repeating-radial-gradient(circle at 50% 50%,transparent 0 13%,var(--motif) 13.3% 13.7%,transparent 14% 20%);box-shadow:0 0 0 12px var(--hero),0 0 0 13px var(--motif)}
.section{padding-block:clamp(35px,6vw,72px);scroll-margin-top:12px}
.section + .section{border-top:1px solid var(--edge)}
.section h2{font-size:clamp(1.95rem,4.4vw,3.55rem);letter-spacing:-.035em;margin:0 0 18px}
.section>p,.article{max-width:74ch}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,245px),1fr));gap:14px;margin-top:24px}
.card{border:1px solid var(--edge);border-top:4px solid var(--accent);background:var(--card);padding:21px;display:flex;flex-direction:column;align-items:flex-start}
.card h3{font-size:1.6rem;margin:10px 0 1px}
.card p:not(.eyebrow){color:var(--muted);margin:10px 0 16px}
.card .more{margin-top:auto}
.button,button{display:inline-flex;align-items:center;justify-content:center;background:var(--accent);color:#fff;padding:10px 17px;min-height:44px;border:1px solid transparent;border-radius:4px;text-decoration:none;font:inherit;font-weight:750;cursor:pointer}
.hero .button{background:var(--light);color:var(--hero)}
.secondary{color:var(--accent);background:var(--card);border-color:var(--edge)}
.controls{display:flex;flex-wrap:wrap;gap:12px;align-items:end;margin-block:14px}
label{display:grid;gap:4px;font-weight:700}
input,select,textarea{font:inherit;padding:9px;border:1px solid var(--edge);border-radius:4px;background:var(--card);color:var(--ink);max-width:100%}
form.stacked{display:grid;gap:14px;max-width:650px}
form.stacked button{justify-self:start}
textarea{min-height:130px}
.status{min-height:1.6rem;color:var(--accent);font-weight:700}
.planner{border:1px solid var(--edge);background:var(--card);padding:20px;margin-top:22px}
.pill{font-weight:800;color:var(--accent);font-variant-numeric:tabular-nums}
.story-list{columns:3 225px;column-gap:28px;padding-left:20px}
.story-list li{break-inside:avoid;padding-block:4px}
.article p{overflow-wrap:anywhere}
footer{background:var(--hero);color:var(--hero-text);padding-block:26px;font-size:.9rem}
footer span{color:var(--light)}
[hidden]{display:none!important}
@media(max-width:680px){.hero-grid{grid-template-columns:1fr}.emblem{display:none}.top-row{align-items:flex-start;flex-direction:column;gap:8px}}
@media print{header,footer,.hero,button,.controls{display:none}.card{break-inside:avoid}}
`;

export const client = String.raw`
const siteRoot = new URL('.', document.currentScript.src);
const status = document.querySelector('[data-status]');
const search = document.querySelector('[data-filter]');
const category = document.querySelector('[data-category]');
const items = Array.from(document.querySelectorAll('[data-item]'));
function filter() {
  const term = search.value.trim().toLowerCase();
  let visible = 0;
  for (const item of items) {
    item.hidden = !item.textContent.toLowerCase().includes(term) ||
      Boolean(category?.value && item.dataset.group !== category.value);
    if (!item.hidden) visible++;
  }
  document.querySelector('[data-count]').textContent = visible + ' matching entries';
}
search?.addEventListener('input', filter);
category?.addEventListener('change', filter);

const list = document.querySelector('[data-plan]');
if (list) {
  const key = 'tabor-plan-v1:' + list.dataset.plan;
  let selection = [];
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? '[]');
    if (Array.isArray(saved)) selection = saved.filter(id => items.some(item => item.dataset.item === id));
  } catch {}
  const output = list.querySelector('ul');
  list.hidden = false;
  for (const item of items) item.querySelector('[data-save]').hidden = false;
  function render() {
    output.replaceChildren();
    for (const item of items) {
      const selected = selection.includes(item.dataset.item);
      const button = item.querySelector('[data-save]');
      button.setAttribute('aria-pressed', String(selected));
      button.textContent = selected ? 'Remove from list' : 'Add to list';
      if (selected) {
        const entry = document.createElement('li');
        entry.textContent = item.querySelector('h3').textContent;
        output.append(entry);
      }
    }
    if (!output.children.length) {
      const empty = document.createElement('li');
      empty.textContent = 'Your list is empty.';
      output.append(empty);
    }
    try { localStorage.setItem(key, JSON.stringify(selection)); } catch {}
  }
  for (const item of items) item.querySelector('[data-save]').addEventListener('click', () => {
    const id = item.dataset.item;
    selection = selection.includes(id) ? selection.filter(value => value !== id) : [...selection, id];
    render();
    status.textContent = selection.length + ' items selected';
  });
  list.querySelector('[data-print]').addEventListener('click', () => window.print());
  list.querySelector('[data-download]').addEventListener('click', () => {
    if (!selection.length) {
      status.textContent = 'Add an item before downloading.';
      return;
    }
    const names = Array.from(output.children, item => item.textContent);
    const url = URL.createObjectURL(new Blob([names.join('\n')], {type:'text/plain'}));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = list.dataset.plan + '-giving-list.txt';
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  render();
}
`;

export const editorClient = `
const form = document.querySelector('[data-editor]');
if (form) {
  const output = form.querySelector('[data-editor-status]');
  const queue = document.querySelector('[data-queue]');
  const field = name => form.elements.namedItem(name);
  const state = { id: null, revision: null };
  const token = () => 'Bearer ' + field('token').value.trim();
  async function loadQueue() {
    const url = 'api/articles?edition=' + encodeURIComponent(field('edition').value);
    const response = await fetch(new URL(url, siteRoot), { headers: { Authorization: token() } });
    if (!response.ok) throw new Error('Could not load the queue. Check the edition and publisher token.');
    const { articles } = await response.json();
    queue.replaceChildren();
    for (const article of articles) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'secondary';
      button.textContent = article.title + ' · ' + article.status;
      button.addEventListener('click', () => {
        for (const name of ['slug', 'title', 'byline', 'body', 'status']) field(name).value = article[name];
        state.id = article.id;
        state.revision = article.revision;
        output.textContent = 'Loaded ' + article.title;
      });
      queue.append(button);
    }
    output.textContent = articles.length + ' articles in the last-updated view.';
  }
  form.querySelector('[data-load]').addEventListener('click', async () => {
    try { await loadQueue(); } catch (error) { output.textContent = error.message; }
  });
  form.querySelector('[data-new]').addEventListener('click', () => {
    for (const name of ['slug', 'title', 'byline', 'body']) field(name).value = '';
    field('status').value = 'draft';
    state.id = null;
    state.revision = null;
    output.textContent = 'New draft';
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(form));
    delete payload.token;
    Object.assign(payload, state);
    const submit = form.querySelector('[type=submit]');
    submit.disabled = true;
    try {
      const response = await fetch(new URL('api/publish', siteRoot), {
        method: 'POST', headers: { Authorization: token(), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      state.id = result.id;
      state.revision = result.revision;
      await loadQueue();
      output.textContent = 'Saved · ' + result.status + ' · ' + result.path;
    } catch (error) {
      output.textContent = error.message || 'Could not save the article.';
    } finally {
      submit.disabled = false;
    }
  });
}
`;
