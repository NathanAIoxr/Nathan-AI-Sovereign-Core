const edition = {
  "id": "voodoo",
  "title": "Voodoo, Vodou & Hoodoo",
  "kicker": "SPIRIT, PRACTICE & IMAGERY",
  "summary": "Explore Nathan Tabor’s symbolic readings alongside a reader that distinguishes Vodou, Hoodoo, and his creative adaptations.",
  "book": "Spirit and Practice Reader",
  "game": "Symbol & Source",
  "mode": "match",
  "glyph": "◈",
  "accent": "#edbcbd",
  "tone": "#42273a",
  "chapters": [
    [
      "Tradition and terminology",
      "Vodou is a religion. Hoodoo names African American folk practices with distinct histories. Nathan’s creative archive uses Voodoo imagery and KJV-based interpretation in a separate personal framework."
    ],
    [
      "Images and intent",
      "The archive contains February reflections on Voodoo and black-magic symbolism and an August concept for a symbolic doll associated with personal healing intent. The source records an intention. No medical outcome is established."
    ],
    [
      "Cross-reference to GOODOO⁷ and JOODOO",
      "Nathan’s coined terms put doing good and practicing joy into action. They have their own app, reader, and game."
    ]
  ],
  "questions": [
    [
      "Which term names a religion in this reader?",
      "Vodou",
      "JOODOO",
      "Cigam"
    ],
    [
      "Which term names African American folk practices here?",
      "Hoodoo",
      "Heka",
      "JOODOO"
    ],
    [
      "What is established by the symbolic doll note?",
      "The writer’s stated intent",
      "A clinical outcome",
      "A historical cure"
    ],
    [
      "Where does Nathan’s creative framework continue?",
      "GOODOO⁷ and JOODOO",
      "Castles & Unicorns",
      "Dragon taxonomy"
    ]
  ],
  "catalog": [],
  "siblings": [
    [
      "heka",
      "Heka"
    ],
    [
      "dragons",
      "Dragons"
    ],
    [
      "unicorns",
      "Unicorns"
    ],
    [
      "castles-unicorns",
      "Castles & Unicorns"
    ],
    [
      "liberation-codex",
      "Liberation Codex"
    ],
    [
      "manifestation",
      "Manifestation"
    ],
    [
      "magic",
      "Magic"
    ],
    [
      "cigam",
      "Cigam"
    ],
    [
      "goodoo-joodoo",
      "GOODOO⁷ + JOODOO"
    ]
  ]
};
const gameInstructions = "Choose the best answer, check your score, and play again.";
const style = "\n[hidden]{display:none!important}*{box-sizing:border-box}html{color-scheme:dark}body{margin:0;background:#111019;color:#f7f4fb;font:1rem/1.65 system-ui,sans-serif}a{color:var(--accent)}a:focus-visible,button:focus-visible,input:focus-visible,textarea:focus-visible,select:focus-visible{outline:2px solid var(--accent);outline-offset:4px}header{border-bottom:1px solid #ffffff24;background:#14111d}nav,.wrap{width:min(1080px,calc(100% - 2.5rem));margin:auto}nav{min-height:68px;display:flex;align-items:center;gap:1.2rem;flex-wrap:wrap;padding-block:.65rem}nav a{text-decoration:none;font-size:.93rem}nav a:first-child{margin-right:auto;font-weight:800;color:#fff}nav [aria-current]{text-decoration:underline;text-underline-offset:5px}.hero{position:relative;overflow:hidden;background:radial-gradient(ellipse at 90% 18%,var(--tone),transparent 67%),#15121e;border-bottom:1px solid #ffffff24;padding:clamp(3rem,8vw,7.5rem) 0}.hero .wrap{position:relative;isolation:isolate}.mark{position:absolute;inset:auto 0 0 auto;z-index:-1;color:var(--accent);opacity:.19;font:clamp(7rem,25vw,20rem)/.8 Georgia,serif}.kicker{color:var(--accent);font-size:.77rem;font-weight:800;letter-spacing:.17em}h1,h2,h3{line-height:1.13;margin:0 0 .8rem;font-family:Georgia,serif}h1{letter-spacing:-.045em;font-size:clamp(2.8rem,8vw,6.6rem);max-width:850px}h2{font-size:clamp(1.65rem,4vw,2.5rem)}h3{font-size:1.36rem}p{margin:.55rem 0 1rem}.intro{color:#ddd6e9;max-width:570px;font-size:1.12rem}.actions,.choices{display:flex;gap:.65rem;flex-wrap:wrap;margin-top:1.2rem}.button,button{display:inline-block;cursor:pointer;border:1px solid var(--accent);border-radius:5px;padding:.58rem 1rem;font:inherit;font-weight:750;color:#181321;background:var(--accent);text-decoration:none}.button.secondary,.choices button,.subtle{background:transparent;color:var(--accent)}button:disabled{opacity:.65;cursor:default}.main{padding:2.4rem 0 4rem}.grid{display:grid;gap:1rem;grid-template-columns:repeat(auto-fit,minmax(min(100%,245px),1fr))}.card,.panel{padding:1.3rem;border:1px solid #ffffff27;background:#1c1825;border-radius:8px}.card p{color:#d5cfe1}.reading article{max-width:760px;padding:1.2rem 0;border-bottom:1px solid #ffffff24}.reading article:last-child{border-bottom:0}.panel{max-width:760px}label{display:block;margin:.65rem 0;color:#eee7f7}input,textarea,select{width:100%;background:#13101a;color:#fff;border:1px solid #867b94;border-radius:5px;padding:.65rem;font:inherit}textarea{min-height:5rem}output{display:block;white-space:pre-wrap;overflow-wrap:anywhere;margin-top:1rem}#round{margin-top:1rem}#feedback{min-height:1.6em;color:var(--accent)}#records{margin-top:1.25rem}.meta{font-size:.82rem;color:var(--accent)}footer{border-top:1px solid #ffffff24;padding:2rem 0 2.7rem;color:#c5bbd1}footer details{margin-top:.8rem}footer ul{padding-left:1rem;display:flex;flex-wrap:wrap;column-gap:1.8rem;row-gap:.35rem}summary{cursor:pointer}";
const gameSource = "\nconst root = document.querySelector('#interactive');\nconst response = await fetch('/api/app');\nif (!response.ok) throw new Error('Could not load the app data');\nconst { mode, questions, catalog } = await response.json();\nconst byId = id => document.getElementById(id);\nconst pick = items => items[Math.floor(Math.random() * items.length)];\nfunction node(tag, text, className) {\n  const el = document.createElement(tag);\n  if (text) el.textContent = text;\n  if (className) el.className = className;\n  return el;\n}\nfunction mix(items) {\n  const shuffled = [...items];\n  for (let i = shuffled.length - 1; i > 0; i--) {\n    const j = Math.floor(Math.random() * (i + 1));\n    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];\n  }\n  return shuffled;\n}\nfunction quiz() {\n  const pool = mode === 'catalog' ? mix(catalog).filter(item => catalog.some(other => other[3] !== item[3])).slice(0, 8).map(item => {\n    const alternatives = [...new Set(catalog.map(row => row[3]).filter(category => category !== item[3]))];\n    return ['Which catalog category contains ' + item[1] + '?', item[3], ...mix(alternatives).slice(0, 2)];\n  }) : mix(questions);\n  let turn = 0;\n  let score = 0;\n  const round = byId('round');\n  const feedback = byId('feedback');\n  const next = byId('next');\n  function show() {\n    round.replaceChildren();\n    feedback.textContent = '';\n    next.hidden = true;\n    const question = pool[turn];\n    if (!question) {\n      round.append(node('h3', 'Score: ' + score + ' / ' + pool.length));\n      next.textContent = 'Play again';\n      next.hidden = false;\n      next.onclick = quiz;\n      next.focus();\n      return;\n    }\n    const [prompt, answer, ...distractors] = question;\n    round.append(node('p', 'Round ' + (turn + 1) + ' of ' + pool.length, 'meta'), node('h3', prompt));\n    const choices = node('div', '', 'choices');\n    for (const label of mix([answer, ...distractors])) {\n      const choice = node('button', label);\n      choice.type = 'button';\n      choice.onclick = () => {\n        if (label === answer) score++;\n        feedback.textContent = label === answer ? 'Correct.' : 'Answer: ' + answer;\n        for (const button of choices.children) button.disabled = true;\n        turn++;\n        next.hidden = false;\n        next.textContent = turn < pool.length ? 'Next question' : 'See score';\n        next.onclick = () => { show(); choicesAfterRender(); };\n        next.focus();\n      };\n      choices.append(choice);\n    }\n    round.append(choices);\n  }\n  function choicesAfterRender() { round.querySelector('button')?.focus(); }\n  show();\n}\nfunction reverseGame() {\n  const puzzles = mix(['MAGIC','EVOL','GOD','LIVE','TABOR','DOG','WARD','REWARD']);\n  const reversed = text => {\n    const parts = typeof Intl.Segmenter === 'function' ? [...new Intl.Segmenter().segment(text)].map(part => part.segment) : Array.from(text);\n    return parts.reverse().join('');\n  };\n  let turn = 0;\n  let score = 0;\n  const form = byId('reverse-form');\n  function render() {\n    byId('prompt').textContent = puzzles[turn] || 'Score: ' + score + ' / ' + puzzles.length;\n    form.hidden = !puzzles[turn];\n  }\n  form.onsubmit = event => {\n    event.preventDefault();\n    const guess = byId('guess');\n    const answer = reversed(puzzles[turn]);\n    const right = answer === guess.value.trim().toUpperCase();\n    if (right) score++;\n    byId('feedback').textContent = right ? 'Correct.' : 'Answer: ' + answer;\n    turn++;\n    guess.value = '';\n    render();\n  };\n  byId('reverse-text').oninput = event => { byId('reverse-result').textContent = reversed(event.target.value); };\n  byId('reverse-replay').onclick = reverseGame;\n  render();\n}\nfunction storyteller() {\n  const forces = ['Command','Transfer','Reverse','Interrupt','Deny','Escalate','Expose','Confine','Liberate','Transform','Recruit','Overturn','Sovereignty'];\n  const missions = ['Free a guide held at the border','Negotiate a safe passage','Expose a forged message','Repair the sanctuary gate','Unite two rival camps','Recover a missing map'];\n  let turns = 0;\n  let players = [];\n  const form = byId('story-setup');\n  function draw() {\n    byId('round').textContent = players[turns % players.length] + ' draws ' + pick(forces) + '. ' + pick(missions) + '.';\n    byId('story-turn').hidden = false;\n    byId('outcome').focus();\n  }\n  form.onsubmit = event => {\n    event.preventDefault();\n    players = byId('players').value.split(',').map(name => name.trim()).filter(Boolean);\n    if (players.length < 2) {\n      byId('round').textContent = 'Enter at least two player names.';\n      byId('story-turn').hidden = true;\n      return;\n    }\n    byId('log').replaceChildren();\n    turns = 0;\n    draw();\n  };\n  byId('story-turn').onsubmit = event => {\n    event.preventDefault();\n    const input = byId('outcome');\n    if (!input.value.trim()) return;\n    byId('log').append(node('li', byId('round').textContent + ' ' + input.value.trim()));\n    input.value = '';\n    turns++;\n    draw();\n  };\n}\nfunction missions() {\n  let current = [];\n  const form = byId('mission-form');\n  byId('draw').onclick = () => {\n    const scene = ['Dragon','Unicorn','Castle','Dungeon'].map(faction => {\n      const item = pick(catalog.filter(record => record[2] === faction));\n      return faction + ': ' + item[1];\n    });\n    current = scene;\n    form.hidden = false;\n    byId('round').replaceChildren(...scene.map(line => node('p', line)));\n    byId('round').append(node('p', 'What does each ally do to open a safe route out?'));\n  };\n  form.onsubmit = event => {\n    event.preventDefault();\n    const result = byId('mission-outcome');\n    if (!result.value.trim()) return;\n    byId('mission-log').append(node('li', current.join(' · ') + ' — ' + result.value.trim()));\n    result.value = '';\n    form.hidden = true;\n    byId('draw').focus();\n  };\n}\nfunction plan() {\n  quiz();\n  const order = [['WHO','What can you observe directly?'],['YOU','What assumption can you test or release?'],['BE','What action can you take this week?']];\n  const form = byId('plan-form');\n  for (const [label, prompt] of order) {\n    const row = node('label', label + ' · ' + prompt);\n    const box = node('textarea');\n    box.required = true;\n    box.maxLength = 350;\n    row.append(box);\n    form.insertBefore(row, form.lastElementChild);\n  }\n  form.onsubmit = event => {\n    event.preventDefault();\n    const answers = [...form.querySelectorAll('textarea')].map(box => box.value.trim());\n    if (answers.some(answer => !answer)) return;\n    byId('plan-result').textContent = order.map(([label], i) => label + ': ' + answers[i]).join('\\n');\n  };\n}\nfunction browse() {\n  const search = byId('search');\n  const select = byId('faction');\n  for (const faction of new Set(catalog.map(item => item[2]))) {\n    const option = node('option', faction);\n    option.value = faction;\n    select.append(option);\n  }\n  function render() {\n    const term = search.value.trim().toLocaleLowerCase();\n    const visible = catalog.filter(item => (!select.value || select.value === item[2]) && item.slice(1).join(' ').toLocaleLowerCase().includes(term));\n    byId('count').textContent = visible.length + ' records';\n    byId('records').replaceChildren(...visible.map(([id, name, faction, category, description, review]) => {\n      const article = node('article', '', 'card');\n      article.append(node('p', faction + ' · ' + id.toUpperCase(), 'meta'), node('h3', name), node('p', category), node('p', description), node('p', 'Source status: ' + review, 'meta'));\n      return article;\n    }));\n  }\n  search.oninput = select.onchange = render;\n  render();\n}\nif (root.dataset.view === 'catalog') browse();\nelse ({ match: quiz, catalog: quiz, reverse: reverseGame, story: storyteller, mission: missions, plan })[mode]();\n";

const escape = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[character]);
const { id, title, kicker, summary, book, game, mode, glyph, accent, tone, chapters, questions, catalog, siblings } = edition;
const textHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Content-Security-Policy': "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
};
function reply(body, type, status = 200, extra = {}) {
  return new Response(body, { status, headers: { ...textHeaders, 'Content-Type': type + '; charset=utf-8', ...extra } });
}
function link(path, label, current) {
  return '<a href="' + path + '"' + (current === path ? ' aria-current="page"' : '') + '>' + escape(label) + '</a>';
}
function button(path, label, secondary = false) {
  return '<a class="button' + (secondary ? ' secondary' : '') + '" href="' + path + '">' + escape(label) + '</a>';
}
function page(current, heading, description, content, actions = '', interactive = false) {
  const nav = link('/', title, current) + link('/books', 'Books', current) + link('/game', 'Game', current) + (catalog.length ? link('/catalog', 'Catalog', current) : '');
  const otherApps = siblings.map(([slug, name]) => '<li>' + link('https://tabor-' + slug + '.nathantaboract.workers.dev', name) + '</li>').join('');
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="' + escape(description) + '"><title>' + escape(heading === title ? title + ' · Nathan Tabor' : heading + ' · ' + title) + '</title><link rel="stylesheet" href="/style.css">' + (interactive ? '<script type="module" src="/game.js"></script>' : '') + '</head><body><header><nav aria-label="Main">' + nav + '</nav></header><main><section class="hero"><div class="wrap"><span aria-hidden="true" class="mark">' + escape(glyph) + '</span><p class="kicker">' + escape(kicker) + '</p><h1>' + escape(heading) + '</h1><p class="intro">' + escape(description) + '</p>' + actions + '</div></section><div class="wrap main">' + content + '</div></main><footer><div class="wrap">Nathan Tabor<details><summary>More editions</summary><ul>' + otherApps + '</ul></details></div></footer></body></html>';
}
function card(path, heading, description) {
  return '<article class="card"><h3>' + link(path, heading) + '</h3><p>' + escape(description) + '</p></article>';
}
const gameUI = {
  match: '<div id="round"></div><p id="feedback" role="status"></p><button id="next" type="button" hidden>Next question</button>',
  catalog: '<div id="round"></div><p id="feedback" role="status"></p><button id="next" type="button" hidden>Next question</button>',
  reverse: '<h2 id="prompt"></h2><form id="reverse-form"><label for="guess">Read it backwards</label><input id="guess" required maxlength="70" autocomplete="off"><p class="actions"><button>Check answer</button></p></form><p id="feedback" role="status"></p><button type="button" id="reverse-replay" class="subtle">New round</button><hr><label for="reverse-text">Reverse your own text</label><input id="reverse-text" maxlength="140" placeholder="MAGIC"><output id="reverse-result" aria-live="polite"></output>',
  story: '<form id="story-setup"><label for="players">Player names, separated by commas</label><input id="players" value="Storyteller One, Storyteller Two" maxlength="200" required><p class="actions"><button>Start session</button></p></form><h2 id="round" aria-live="polite"></h2><form id="story-turn" hidden><label for="outcome">How does the scene end?</label><input id="outcome" maxlength="240" required><p class="actions"><button>Record and pass the turn</button></p></form><ol id="log" aria-label="Turn history"></ol>',
  mission: '<button id="draw" type="button">Draw a mission</button><div id="round" aria-live="polite"></div><form id="mission-form" hidden><label for="mission-outcome">How did the alliance complete the mission?</label><input id="mission-outcome" required maxlength="240"><p><button>Record the outcome</button></p></form><ol id="mission-log" aria-label="Completed missions"></ol>',
  plan: '<h2>Scenario challenge</h2><div id="round"></div><p id="feedback" role="status"></p><button id="next" type="button" hidden>Next question</button><hr><h2>Build your own action plan</h2><form id="plan-form"><button>Build my plan</button></form><output id="plan-result" aria-live="polite"></output>'
};
export default {
  async fetch(request) {
    const path = new URL(request.url).pathname.replace(/\/+$/, '') || '/';
    if (!['GET','HEAD'].includes(request.method)) return reply('Method not allowed', 'text/plain', 405, { Allow: 'GET, HEAD' });
    const send = (body, type, status, extra) => reply(request.method === 'HEAD' ? null : body, type, status, extra);
    if (path === '/style.css') return send(':root{--accent:'+accent+';--tone:'+tone+'}'+style, 'text/css');
    if (path === '/game.js') return send(gameSource, 'text/javascript');
    if (path === '/healthz') return send(JSON.stringify({ status: 'ok', app: id, records: catalog.length }), 'application/json');
    if (path === '/api/app') return send(JSON.stringify({ mode, questions, catalog }), 'application/json');
    if (path === '/books/reader.md') return send('# '+book+'\n\nEditorial edition based on Nathan Tabor’s recovered work.\n\n'+chapters.map(([name, body]) => '## '+name+'\n\n'+body).join('\n\n')+'\n', 'text/markdown', 200, { 'Content-Disposition': 'attachment; filename="'+id+'-reader.md"' });
    if (path === '/books') return send(page(path, book, 'Editorial edition based on Nathan Tabor’s recovered work.', '<section class="reading" aria-label="Chapters">'+chapters.map(([name, body])=>'<article><h2>'+escape(name)+'</h2><p>'+escape(body)+'</p></article>').join('')+'</section>', '<div class="actions">'+button('/books/reader.md','Download reader')+'</div>'), 'text/html');
    if (path === '/game') return send(page(path, game, gameInstructions, '<section id="interactive" data-view="game" class="panel" aria-label="Game">'+gameUI[mode]+'<noscript>Enable JavaScript to play.</noscript></section>', '', true), 'text/html');
    if (path === '/catalog' && catalog.length) return send(page(path, title+' Catalog', catalog.length+' source records. Categories and status are preserved from the source catalog.', '<section id="interactive" data-view="catalog"><div class="grid"><label>Search records<input id="search" placeholder="Name, tradition, or keyword"></label><label>Category family<select id="faction"><option value="">All</option></select></label></div><p id="count" role="status"></p><div id="records" class="grid"></div><noscript>Enable JavaScript to search the catalog.</noscript></section>', '', true), 'text/html');
    if (path !== '/') return send(page(path, 'Page not found', 'Return to the edition home page.', button('/','Home')), 'text/html', 404);
    const features = card('/books', book, 'Read online or download the book as Markdown.') + card('/game', game, gameInstructions) + (catalog.length ? card('/catalog', 'Browse the catalog', 'Search '+catalog.length+' names and source descriptions.') : '');
    return send(page(path, title, summary, '<div class="grid">'+features+'</div>', '<div class="actions">'+button('/game','Play the game')+button('/books','Browse books',true)+'</div>'), 'text/html');
  }
};
