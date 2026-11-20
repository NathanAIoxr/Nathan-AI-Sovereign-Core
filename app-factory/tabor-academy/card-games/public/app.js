import { activities } from './play.js';

const byId = (id) => document.getElementById(id);
const form = byId('filters');
const list = byId('results');
const more = byId('more');
const detail = byId('game-detail');
const label = byId('results-label');
const gameRoot = new URL(document.baseURI);
const statuses = {
  documented:'Documented edition', reconstructed:'Historical reconstruction', original:'Academy edition',
  indexed:'Linked reference', fragment:'Unresolved history',
};
const el = (tag, text, className) => {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
};

function gameLink(id, text) {
  const a = el('a', text);
  const url = new URL(location.href);
  url.searchParams.set('game', id);
  url.hash = 'game-detail';
  a.href = url.href;
  a.addEventListener('click', (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    history.pushState(null,'',url);
    showGame(id, true);
  });
  return a;
}

async function get(path) {
  const r = await fetch(new URL(path,gameRoot));
  if (!r.ok) throw new Error('Request returned ' + r.status);
  return r.json();
}

let offset = 0;
let listRequest = 0;
let detailRequest = 0;
let active = new URLSearchParams();
function readFilters() {
  const query = new URLSearchParams(new FormData(form));
  for (const [key, value] of [...query]) if (!value) query.delete(key);
  if (query.has('play')) query.set('play','1');
  return query;
}

function hydrateFilters() {
  const params = new URL(location.href).searchParams;
  byId('query').value = params.get('q') || '';
  byId('family').value = params.get('family') || '';
  byId('status').value = params.get('status') || '';
  byId('play-only').checked = params.get('play') === '1';
  active = new URLSearchParams([...params].filter(([key]) => ['q','family','status','play'].includes(key)));
}

function showCard(game) {
  const card = el('article','','catalog-card');
  card.append(el('h3',game.title), el('p',[game.family,statuses[game.status]].join(' · '),'metadata'),
    gameLink(game.id, game.engine ? 'Rules & practice' : 'Open record'));
  return card;
}

async function search(append = false) {
  const requestNumber = ++listRequest;
  const options = new URLSearchParams(active);
  if (!append) offset = 0;
  if (offset) options.set('offset',offset);
  more.disabled = true;
  label.textContent = 'Loading games…';
  try {
    const data = await get('api/games?' + options);
    if (requestNumber !== listRequest) return;
    const cards = data.games.map(showCard);
    if (append) list.append(...cards);
    else list.replaceChildren(...cards);
    label.textContent = data.total ? 'Showing ' + list.children.length + ' of ' + data.total + ' matches' : 'No games match. Try another title or filter.';
    offset = data.nextOffset;
    more.hidden = offset === null;
    if (append && cards.length) cards[0].querySelector('a').focus();
  } catch {
    if (requestNumber !== listRequest) return;
    label.textContent = 'The catalog could not load. Run the search again.';
    more.hidden = true;
  } finally {
    if (requestNumber === listRequest) more.disabled = false;
  }
}

function closeDetail() {
  detailRequest++;
  detail.hidden = true;
  detail.replaceChildren();
}

async function showGame(id, focus = false) {
  if (!id) { closeDetail(); return; }
  const requestNumber = ++detailRequest;
  detail.hidden = false;
  detail.replaceChildren(el('p','Loading game…'));
  try {
    const game = await get('api/games/' + encodeURIComponent(id));
    if (requestNumber !== detailRequest) return;
    const heading = el('h2',game.title);
    heading.id = 'game-title'; heading.tabIndex = -1;
    const metadata = [statuses[game.status],game.family,game.region,game.players && game.players + ' players',game.deck].filter(Boolean);
    detail.replaceChildren(heading,el('p',metadata.join(' · '),'metadata'));
    if (game.aliases.length) detail.append(el('p','Also indexed as ' + game.aliases.join(', ') + '.','metadata'));
    if (game.research) detail.append(el('h3','Research record'),el('p',game.research));
    if (game.rulebook) {
      for (const [key,title] of [['setup','Set up'],['turns','Take a turn'],['finish','Finish and score'],['teach','Teach it']]) {
        detail.append(el('h3',title),el('p',game.rulebook[key]));
      }
    } else if (game.status === 'indexed') {
      detail.append(el('p','Open the linked rules to read this edition.'));
    }
    if (game.sources.length) {
      const sources = el('ul');
      for (const source of game.sources) {
        const link = el('a',source.label);
        link.href = source.url;
        const row = el('li'); row.append(link); sources.append(row);
      }
      detail.append(el('h3','Sources'),sources);
    }
    if (game.engine && Object.hasOwn(activities,game.engine)) {
      const table = el('div'); table.id = 'play-table';
      detail.append(table);
      activities[game.engine](table);
    }
    if (focus) { heading.focus({ preventScroll:true }); detail.scrollIntoView({ block:'start' }); }
  } catch {
    if (requestNumber === detailRequest) detail.replaceChildren(el('p','This game could not load. Open it from the catalog again.'));
  }
}

async function prepare() {
  try {
    const info = await get('api/health');
    byId('counts').textContent = info.games.toLocaleString() + ' catalog records · ' + info.rules +
      ' in-library rulebooks · ' + info.play + ' browser activities · ' + info.lessons + ' lessons';
    const selected = new URL(location.href).searchParams.get('family') || '';
    for (const name of info.families) {
      const option = el('option',name); option.value = name; byId('family').append(option);
    }
    byId('family').value = selected;
  } catch { byId('counts').textContent = 'Catalog totals are temporarily unavailable.'; }
}

async function lessons() {
  const target = byId('lesson-list');
  try {
    const data = await get('api/lessons');
    for (const lesson of data.lessons) {
      const item = el('details');
      const summary = el('summary');
      summary.append(el('span',lesson.level,'level'), document.createTextNode(lesson.title));
      const steps = el('ol');
      for (const step of lesson.steps) steps.append(el('li',step));
      item.append(summary,el('p',lesson.minutes + ' minutes','metadata'),steps,el('p',lesson.check));
      if (lesson.game_id) item.append(gameLink(lesson.game_id,'Open linked game'));
      target.append(item);
    }
  } catch { target.textContent = 'Lessons could not load. Reload to try again.'; }
}

const scoreForm = byId('score-form');
const scoreKey = 'tabor-academy-card-scores-v1';
const scoreboard = new Map();
try {
  const stored = JSON.parse(localStorage.getItem(scoreKey) || '[]');
  for (const entry of stored) {
    if (Array.isArray(entry) && typeof entry[0] === 'string' && Number.isSafeInteger(entry[1])) scoreboard.set(...entry);
  }
} catch { /* Scores remain available for this visit. */ }

function scoreDisplay() {
  const wrap = byId('score-list');
  if (!scoreboard.size) { wrap.textContent = ''; return; }
  const table = el('table','','score-table');
  const head = el('thead');
  const labels = el('tr');
  labels.append(el('th','Player'),el('th','Total'));
  head.append(labels);
  const body = el('tbody');
  for (const [name,total] of scoreboard) {
    const row = el('tr'); row.append(el('td',name),el('td',String(total))); body.append(row);
  }
  table.append(head,body);
  wrap.replaceChildren(table);
}

function saveScores() {
  try { localStorage.setItem(scoreKey,JSON.stringify([...scoreboard])); }
  catch { /* Storage is optional for a table session. */ }
  scoreDisplay();
}

scoreForm.addEventListener('submit',(event) => {
  event.preventDefault();
  const data = new FormData(scoreForm);
  const name = data.get('player').trim();
  const points = Number(data.get('points'));
  if (!name || !Number.isInteger(points) || Math.abs(points) > 10000) return;
  scoreboard.set(name,(scoreboard.get(name) || 0) + points);
  saveScores();
  scoreForm.elements.points.value = '';
  scoreForm.elements.points.focus();
});
byId('clear-score').addEventListener('click',() => {
  if (scoreboard.size && confirm('Reset this scorecard?')) { scoreboard.clear(); saveScores(); }
});

form.addEventListener('submit',(event) => {
  event.preventDefault();
  active = readFilters();
  const url = new URL(location.href);
  url.search = active;
  url.hash = 'catalog';
  history.pushState(null,'',url);
  closeDetail();
  search();
});

more.addEventListener('click',() => search(true));
window.addEventListener('popstate',() => {
  hydrateFilters();
  search();
  showGame(new URL(location.href).searchParams.get('game'));
});

hydrateFilters();
scoreDisplay();
prepare();
search();
lessons();
const opened = new URL(location.href).searchParams.get('game');
if (opened) showGame(opened,true);
