const form = document.getElementById('tool-search');
const status = document.getElementById('tool-status');
const results = document.getElementById('tool-results');
const more = document.getElementById('tool-more');
const integer = new Intl.NumberFormat();
const kindLabels = { worker: 'Worker source', app: 'App', guide: 'Guide', library: 'Library' };
const initial = new URLSearchParams(location.search);
for (const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') form.elements.letter.add(new Option(letter, letter));
for (const key of ['q', 'source', 'letter']) {
  if (initial.has(key)) form.elements[key].value = initial.get(key);
}
let currentQuery = new URLSearchParams();
let cursor = null;
let requestSequence = 0;

function addRow(tool) {
  const row = document.createElement('li');
  const title = document.createElement('strong');
  const detail = document.createElement('p');
  const tags = document.createElement('small');
  const source = document.createElement('a');
  title.textContent = tool.title;
  detail.textContent = tool.description;
  tags.textContent = [kindLabels[tool.kind], tool.tags].filter(Boolean).join(' · ');
  source.textContent = tool.repository ? 'Open upstream source on GitHub' : 'Open source on GitHub';
  source.href = tool.source_url;
  const sourceLine = document.createElement('p');
  sourceLine.append(source);
  if (tool.license && tool.license_url) {
    const license = document.createElement('a');
    license.href = tool.license_url;
    license.textContent = tool.license;
    sourceLine.append(' · License: ', license);
  }
  row.append(title, detail, tags, sourceLine);
  results.append(row);
}

async function load(append) {
  const request = ++requestSequence;
  if (!append) {
    currentQuery = new URLSearchParams(new FormData(form));
    currentQuery.set('q', currentQuery.get('q').trim());
    cursor = null;
    results.replaceChildren();
  }
  const params = new URLSearchParams(currentQuery);
  if (append && cursor) params.set('after', cursor);
  more.hidden = true;
  status.textContent = 'Searching…';
  try {
    const response = await fetch('/api/cloud-slayer/tools?' + params);
    if (!response.ok) {
      throw new Error(response.status === 400
        ? 'Search with a tool name or up to ten words.'
        : 'Tool search is temporarily unavailable.');
    }
    const data = await response.json();
    if (request !== requestSequence) return;
    for (const tool of data.tools) addRow(tool);
    cursor = data.next;
    more.hidden = !cursor;
    const shown = results.children.length;
    const total = integer.format(data.registered_tools);
    status.textContent = shown
      ? integer.format(shown) + (shown === 1 ? ' tool shown' : ' tools shown') + ' · ' + total + ' in the library'
      : 'No matching tools · ' + total + ' in the library';
  } catch (error) {
    if (request === requestSequence) {
      status.textContent = error.message;
      more.hidden = !cursor;
    }
  }
}

form.addEventListener('submit', event => { event.preventDefault(); load(false); });
more.addEventListener('click', () => load(true));
load(false);
