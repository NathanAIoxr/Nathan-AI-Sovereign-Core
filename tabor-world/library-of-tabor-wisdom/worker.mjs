const groups = [
  {
    "id": 1,
    "title": "Chinese Sages, Strategists & Dialecticians",
    "first": 1,
    "last": 15
  },
  {
    "id": 2,
    "title": "Pre-Socratic Cosmologists & Greek Founders",
    "first": 16,
    "last": 30
  },
  {
    "id": 3,
    "title": "Hellenistic, Stoic, Epicurean & Roman Minds",
    "first": 31,
    "last": 44
  },
  {
    "id": 4,
    "title": "Indian, Vedic, Buddhist & Jain Thinkers",
    "first": 45,
    "last": 58
  },
  {
    "id": 5,
    "title": "Persian, Islamic Golden Age & Jewish Sages",
    "first": 59,
    "last": 71
  },
  {
    "id": 6,
    "title": "Ancient Scientists, Mathematicians & Polymaths",
    "first": 72,
    "last": 85
  },
  {
    "id": 7,
    "title": "Indigenous, African, American & Oral Wisdom Traditions",
    "first": 86,
    "last": 94
  },
  {
    "id": 8,
    "title": "Meta-Philosophy, Debate Engines & Master Wisdom Routers",
    "first": 95,
    "last": 101
  }
]

const archive = 'https://library-of-tabor-archive.nathantaboract.workers.dev'
const headers = {
  'cache-control': 'no-store',
  'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
  'x-content-type-options': 'nosniff',
}

const htmlChars = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
const escape = value => String(value).replace(/[&<>"']/g, char => htmlChars[char])
const serial = number => String(number).padStart(3, '0')
const fold = value => value.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase()
const json = (data, status = 200, extra = {}) =>
  Response.json(data, { status, headers: { ...headers, ...extra } })

function page(title, content) {
  return new Response(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)} | Library of Tabor</title>
<style>
:root{color-scheme:dark;background:#10241f;color:#f8f5eb;font-family:Georgia,serif}
body{margin:0}main{max-width:78rem;margin:auto;padding:clamp(1rem,5vw,4.75rem)}
nav,form,.status,small{font-family:system-ui,sans-serif}
nav{display:flex;flex-wrap:wrap;gap:.5rem 1.75rem;font-size:.9rem}
a{color:#bde5d2;text-underline-offset:.18em}
h1{font-size:clamp(2.25rem,6vw,4.4rem);line-height:1;margin:2rem 0 1rem;max-width:22ch}
h2{font-size:1.45rem}p{max-width:75ch;line-height:1.55}
form{display:flex;gap:.8rem;flex-wrap:wrap;align-items:end;margin:2rem 0 1.4rem}
label{display:grid;gap:.35rem;min-width:0}label:first-child{flex:1 1 16rem}
input,select,button{font:inherit;padding:.65rem;border:1px solid #8aa69a;border-radius:.32rem;max-width:100%}
input,select{background:#193b32;color:#f8f5eb}button{background:#bde5d2;color:#10241f;cursor:pointer}
.status{color:#c4d5cc;font-size:.87rem}section{border-top:1px solid #4d6a60;margin-top:1.75rem}
ol{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,18rem),1fr));list-style:none;padding:0;gap:.7rem}
li{padding:1rem;background:#19332b;border:1px solid #36534a;border-radius:.35rem}
li a{font-size:1.12rem;line-height:1.35}li p{margin-bottom:0;font-size:.98rem}
small{display:block;color:#d1c39d;margin-bottom:.4rem}
</style></head><body><main>
<nav aria-label="Library navigation"><a href="/">Wisdom Catalog</a><a href="${archive}/works/tabor-wisdom">Library of Tabor archive record</a><a href="/api/catalog">JSON catalog</a></nav>
${content}</main></body></html>`, {
    headers: { ...headers, 'content-type': 'text/html; charset=utf-8' },
  })
}

async function route(request, db) {
  const url = new URL(request.url)
  const path = url.pathname
  const detail = /^(\/api)?\/entries\/(\d{3})$/.exec(path)
  if (path !== '/' && path !== '/api/catalog' && !detail) return json({ error: 'Not found' }, 404)

  const query = (url.searchParams.get('q') ?? '').trim()
  const groupID = url.searchParams.get('group') ?? ''
  if (query.length > 120 || (groupID && !groups.some(group => String(group.id) === groupID))) {
    return json({ error: 'Invalid search or collection' }, 400)
  }

  const { results } = await db.prepare(`SELECT id, title, description FROM archive_works
    WHERE id BETWEEN 'tabor-wisdom-001' AND 'tabor-wisdom-101'
    AND id GLOB 'tabor-wisdom-[0-9][0-9][0-9]' ORDER BY id`).all()
  const entries = results.map(row => {
    const number = Number(row.id.slice(-3))
    const collection = groups.find(group => number >= group.first && number <= group.last)
    return { ...row, number, collection: collection.id, status: 'cataloged-proposal' }
  })

  if (detail) {
    const entry = entries.find(item => serial(item.number) === detail[2])
    if (!entry) return json({ error: 'Entry not found' }, 404)
    if (detail[1]) return json(entry)
    const group = groups[entry.collection - 1]
    return page(entry.title, `<p><a href="/?group=${group.id}">${escape(group.title)}</a></p>
    <h1>${escape(entry.title)}</h1><p class="status">Entry ${serial(entry.number)} · Cataloged proposal</p>
    <p>${escape(entry.description)}</p>
    <p><a href="${archive}/works/${entry.id}">Archive record</a> · <a href="/api/entries/${serial(entry.number)}">Entry JSON</a></p>`)
  }

  const terms = fold(query).split(/\s+/).filter(Boolean)
  const matching = entries.filter(entry => {
    const title = groups[entry.collection - 1].title
    const searchable = fold(`${serial(entry.number)} ${entry.number} ${entry.title} ${entry.description} ${title}`)
    return (!groupID || Number(groupID) === entry.collection) && terms.every(term => searchable.includes(term))
  })
  if (path === '/api/catalog') {
    return json({ collection: 'Library of Tabor Wisdom Catalog', count: matching.length, total: entries.length, groups, entries: matching })
  }

  const sections = groups.map(group => {
    const cards = matching.filter(entry => entry.collection === group.id)
    if (!cards.length) return ''
    return `<section><h2>${escape(group.title)}</h2><ol>${cards.map(entry => `<li>
      <small>${serial(entry.number)}</small><a href="/entries/${serial(entry.number)}">${escape(entry.title)}</a>
      <p>${escape(entry.description)}</p></li>`).join('')}</ol></section>`
  }).join('')
  return page('Wisdom Catalog', `<h1>Library of Tabor Wisdom Catalog</h1>
    <p>Browse the proposed research modules and software engines by entry number, thinker, work, or tradition.</p>
    <form action="/" method="get"><label>Search<input type="search" name="q" maxlength="120" value="${escape(query)}"></label>
    <label>Collection<select name="group"><option value="">All collections</option>
    ${groups.map(group => `<option value="${group.id}"${String(group.id) === groupID ? ' selected' : ''}>${escape(group.title)}</option>`).join('')}
    </select></label><button type="submit">Search</button></form>
    <p class="status">${matching.length} of ${entries.length} entries</p>${sections || '<p>No entries match your search.</p>'}`)
}

export default {
  async fetch(request, env) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return json({ error: 'Method not allowed' }, 405, { allow: 'GET, HEAD' })
    }
    let response
    try {
      response = await route(request, env.ARCHIVE_DB)
    } catch (error) {
      console.error('Wisdom catalog read failed', error)
      response = json({ error: 'Catalog temporarily unavailable' }, 503)
    }
    return request.method === 'HEAD' ? new Response(null, response) : response
  },
}
