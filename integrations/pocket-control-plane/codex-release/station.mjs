const security = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
  'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
};

export function escape(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function response(body, type, status = 200) {
  return new Response(body, { status, headers: { ...security, 'content-type': type + '; charset=utf-8', 'cache-control': 'no-store' } });
}

export function json(value, status = 200) {
  return response(JSON.stringify(value), 'application/json', status);
}

export function page(title, eyebrow, body) {
  return response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escape(title)}</title><style>
  :root{color-scheme:light;--ink:#18271f;--paper:#f3f0e6;--line:#c4c9b8;--green:#284d3c}
  *{box-sizing:border-box}body{font-family:Georgia,serif;margin:0;background:var(--paper);color:var(--ink);line-height:1.55}
  main{width:min(100% - 2rem,64rem);margin:0 auto;padding:2rem 0 4rem}h1{font-size:clamp(2.1rem,6vw,4.3rem);line-height:1.05;margin:.45rem 0 1.3rem;max-width:25ch}
  h2,h3{line-height:1.2}.eyebrow,nav,small,button,input,label{font-family:system-ui,sans-serif}.eyebrow{letter-spacing:.11em;font-size:.78rem;text-transform:uppercase}
  nav,.actions{display:flex;flex-wrap:wrap;gap:.65rem;margin:1rem 0 1.5rem}.actions a,button{padding:.58rem .9rem;border:1px solid var(--green);border-radius:.25rem;text-decoration:none;font-size:1rem;background:var(--green);color:white;cursor:pointer}
  a{color:var(--green);text-underline-offset:.2em}a:focus-visible,button:focus-visible,input:focus-visible{outline:3px solid #996011;outline-offset:3px}
  article,section,fieldset{border-top:1px solid var(--line);padding:1rem 0}fieldset{border:1px solid var(--line);padding:1rem;margin:0 0 1rem}
  label{display:block;margin:.3rem 0}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,16rem),1fr));gap:.65rem 1.2rem}
  .tile{display:block;border-top:1px solid var(--line);padding:.7rem 0}.tile small{display:block}.result{border-left:4px solid var(--green);padding:.55rem .8rem}
  input:not([type=radio]){font-size:1rem;width:min(100%,22rem);padding:.58rem;border:1px solid var(--green);border-radius:.2rem}footer{margin-top:2rem}pre{white-space:pre-wrap;overflow-wrap:anywhere}kbd{font-size:inherit}
  </style><main><p class="eyebrow">${escape(eyebrow)}</p><h1>${escape(title)}</h1>${body}</main></html>`, 'text/html');
}

function activity(project, params) {
  if (project.id === 'codex-06') {
    const fields = ['Latitude A', 'Longitude A', 'Latitude B', 'Longitude B'];
    const limits = [90, 180, 90, 180];
    const values = fields.map((_, index) => params.get('point' + index) ?? '');
    const numbers = values.map(Number);
    const valid = values.every((value, index) => value.trim() && Number.isFinite(numbers[index]) && Math.abs(numbers[index]) <= limits[index]);
    const [a, b, c, d] = numbers.map(n => n * Math.PI / 180);
    const haversine = Math.sin((c - a) / 2) ** 2 + Math.cos(a) * Math.cos(c) * Math.sin((d - b) / 2) ** 2;
    const km = 12742.0088 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, haversine))));
    const result = valid ? km.toFixed(2) + ' km great-circle distance.' : values.some(Boolean) ? 'Enter four coordinates within the indicated ranges.' : '';
    return `<section><h2>Great-circle calculator</h2><form>${fields.map((field, index) =>
      `<label>${field} <input type="number" step="any" name="point${index}" value="${escape(values[index])}" min="${-limits[index]}" max="${limits[index]}" required></label>`).join('')}<button>Calculate</button></form>${result ? `<p class="result">${result}</p>` : ''}</section>`;
  }
  if (project.id === 'sovereign-kodex') {
    const raw = params.get('position');
    const position = Number(raw);
    const notes = ['G♯ / A♭', 'A♯ / B♭', 'C♯ / D♭', 'D♯ / E♭', 'F♯ / G♭'];
    const note = raw === null ? '' : !/^\d{1,7}$/.test(raw) || position > 1000000 ? 'Enter a whole number from 0 to 1,000,000.' :
      position < 4 ? 'This position is reserved.' : 'Symbolic pitch · ' + notes[(position - 4) % notes.length];
    return `<section><h2>Black-key position reader</h2><form><label>Position <input type="number" min="0" max="1000000" name="position" required value="${escape(raw ?? '4')}"></label><button>Find pitch</button></form>${note ? `<p class="result">${note}</p>` : ''}</section>`;
  }
  if (project.id === 'mirror-shadow') {
    const word = (params.get('word') ?? '').slice(0, 90);
    const chars = Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(word), part => part.segment);
    return `<section><h2>Letter reversal</h2><form><label>Word or phrase <input maxlength="90" name="word" value="${escape(word)}"></label><button>Reverse</button></form>${word ? `<p class="result">${escape(chars.reverse().join(''))}</p>` : ''}</section>`;
  }
  return '';
}

function projectUrl(base, route = '') {
  return base + (route ? '/' + route : '/');
}

function projectNav(base) {
  return `<nav aria-label="Project"><a href="${projectUrl(base)}">Overview</a><a href="${projectUrl(base, 'books')}">Reading guide</a><a href="${projectUrl(base, 'game')}">Activity</a><a href="/">Project directory</a></nav>`;
}

export function createProject(project) {
  return { async fetch(request) {
    const head = request.method === 'HEAD';
    if (!head && request.method !== 'GET') return new Response(null, { status: 405, headers: { allow: 'GET, HEAD' } });
    const url = new URL(request.url);
    const expected = '/work/' + project.id;
    const base = url.pathname.startsWith(expected + '/') ? expected : '';
    const path = url.pathname.slice(base.length);
    const nav = projectNav(base);
    let result;
    if (path === '/healthz') {
      result = json({ ready: true, id: project.id, worker: project.worker, version: project.version, sourceStatus: project.status });
    } else if (path === '/catalog') {
      const { question, ...publicProject } = project;
      result = json(publicProject);
    } else if (path === '/') {
      const source = project.sourceUrl ? `<p><a href="${escape(project.sourceUrl)}">Open existing source</a></p>` : '';
      const existing = project.existingUrl ? `<p><a href="${escape(project.existingUrl)}">Open original deployed edition</a></p>` : '';
      result = page(project.title, project.status, nav + `<p>${escape(project.summary)}</p>
        <div class="actions"><a href="${projectUrl(base, 'books')}">Read guide</a><a href="${projectUrl(base, 'game')}">Open activity</a></div>${existing}${source}`);
    } else if (path === '/books') {
      const title = project.book || project.title + ' · Source Note';
      result = page(title, 'Project reading guide', nav + `<article><h2>Project source</h2><p>${escape(project.summary)}</p></article>
      <article><h2>Recorded status</h2><p>${escape(project.status)}</p></article>
      <p><a href="${projectUrl(base, 'books/reader.md')}">Download Markdown</a></p>`);
    } else if (path === '/books/reader.md') {
      result = response('# ' + (project.book || project.title + ' · Source Note') + '\n\n' + project.summary +
        '\n\nSource status · ' + project.status + '\n' + (project.sourceUrl ? '\n' + project.sourceUrl + '\n' : ''), 'text/markdown');
    } else if (path === '/game') {
      const question = project.question;
      const choice = url.searchParams.get('choice');
      const options = project.order ? [question?.correct, question?.other] : [question?.other, question?.correct];
      const right = project.order ? '0' : '1';
      const feedback = choice === null ? '' : `<p class="result" role="status">${choice === right ? 'Correct.' : 'Try the other answer.'}</p>`;
      const prompt = question ? `<form><fieldset><legend>${escape(question.prompt)}</legend>${options.map((item, index) =>
        `<label><input type="radio" name="choice" value="${index}" required> ${escape(item)}</label>`).join('')}</fieldset>
        <button>Check answer</button></form>${feedback}` : '<p>An activity can be based on the original once it is recovered.</p>';
      result = page(project.title, 'Project activity', nav + activity(project, url.searchParams) + prompt);
    } else {
      result = json({ error: 'not_found' }, 404);
    }
    if (!head) return result;
    return new Response(null, { status: result.status, headers: result.headers });
  } };
}
