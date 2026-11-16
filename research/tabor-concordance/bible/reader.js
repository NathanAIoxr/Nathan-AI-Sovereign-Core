'use strict';

const $ = id => document.getElementById(id);
const query = $('query');
const language = $('language');
const results = $('results');
const showAll = $('show-all');
const previous = $('previous');
const next = $('next');
const pageSize = 80;
let index = [];
let matches = [];
let page = 1;
let all = false;
let ready = false;

function fold(value) {
  return value.normalize('NFKD').replace(/\p{M}|[\u034f\u200e\u200fʼʻ‘’']/gu, '').toLowerCase().replace(/ς/g, 'σ').replace(/ı/g, 'i');
}

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function rowView([id, word, lang, , state, meaning, roots]) {
  const row = element('tr');
  const form = element('td');
  const original = element('bdi', word);
  original.lang = { Hebrew: 'he', Aramaic: 'arc', Greek: 'grc' }[lang];
  form.append(original);
  const definition = element('td');
  if (state === 'unavailable') definition.textContent = 'Root meaning unavailable';
  if (state === 'tentative') definition.append(element('span', 'Tentative derivation', 'qualifier'));
  if (meaning) definition.append(element('div', meaning));
  if (roots.length) {
    const list = element('ul');
    for (const [rootId, root, gloss] of roots) {
      const item = element('li');
      if (rootId) {
        const link = element('a', rootId);
        link.href = '#' + rootId;
        link.dataset.root = rootId;
        item.append(link, ' ');
      }
      if (root) item.append(element('bdi', root), ' — ');
      item.append(gloss);
      list.append(item);
    }
    definition.append(list);
  }
  row.append(element('td', id), form, definition);
  return row;
}

function draw() {
  const pages = Math.max(1, Math.ceil(matches.length / pageSize));
  const start = all ? 0 : (page - 1) * pageSize;
  const end = all ? matches.length : Math.min(start + pageSize, matches.length);
  const fragment = document.createDocumentFragment();
  for (let i = start; i < end; i++) fragment.append(rowView(matches[i].row));
  results.replaceChildren(fragment);
  const number = query.value.trim().match(/^g\s*0*([1-9]\d*)$/i);
  const unassigned = number && (+number[1] === 2717 || (+number[1] >= 3203 && +number[1] <= 3302));
  $('status').textContent = matches.length
    ? `${(start + 1).toLocaleString()}–${end.toLocaleString()} of ${matches.length.toLocaleString()}`
    : unassigned ? 'This Strong’s number is unassigned.' : 'No matching entries.';
  $('pages').hidden = all || pages < 2;
  $('page').textContent = `Page ${page} of ${pages}`;
  previous.disabled = page === 1;
  next.disabled = page >= pages;
  showAll.setAttribute('aria-pressed', String(all));
  showAll.textContent = all ? 'Show 80 entries per page' : 'Show all matching entries';
}

function search() {
  if (!ready) return;
  const raw = query.value.trim();
  const token = fold(raw);
  const id = raw.match(/^([HG])?\s*0*([1-9]\d*)$/i);
  matches = index.filter(({ row, word, translit }) => {
    if (language.value && row[2] !== language.value) return false;
    if (!raw) return true;
    if (id) return row[0].slice(1) === id[2] && (!id[1] || row[0][0] === id[1].toUpperCase());
    return token && (word.includes(token) || translit.includes(token));
  });
  if (token && !id) {
    const exact = x => Number(x.word === token || x.translit === token);
    matches.sort((a,b) => exact(b) - exact(a));
  }
  page = 1;
  draw();
}

function applyLink() {
  const id = location.hash.slice(1);
  if (/^[HG]\d+$/i.test(id)) {
    query.value = id;
    language.value = '';
  }
  search();
}

function turnPage(delta) {
  const target = page + delta;
  if (target < 1 || target > Math.ceil(matches.length / pageSize)) return;
  page = target;
  draw();
  $('status').scrollIntoView({block:'center'});
}

showAll.onclick = () => { if (ready) { all = !all; page = 1; draw(); } };
previous.onclick = () => turnPage(-1);
next.onclick = () => turnPage(1);
query.addEventListener('input', search);
language.addEventListener('change', search);
window.addEventListener('hashchange', applyLink);
results.addEventListener('click', event => {
  const link = event.target.closest('a[data-root]');
  if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  history.pushState(null, '', link.getAttribute('href'));
  applyLink();
  query.focus();
});

Promise.all(['hebrew-aramaic.json','greek.json'].map(async file => {
  const response = await fetch(file);
  if (!response.ok) throw new Error(file);
  return response.json();
})).then(tables => {
  index = tables.flat().map(row => ({ row, word:fold(row[1]), translit:fold(row[3]) }));
  ready = true;
  applyLink();
}).catch(() => {
  $('status').textContent = 'The reader could not load. Reload the page or use the full CSV above.';
});
