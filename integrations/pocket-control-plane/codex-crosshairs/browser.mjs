import { readLocalArchive } from './local-archive.mjs';
import { createViews } from './views.mjs';

const byId = id => document.getElementById(id);
const input = byId('archive');
const collectionSelect = byId('collection');
const find = byId('find');
const select = byId('codex');
const status = byId('status');
const grid = byId('views');
const pocket = 'https://nathan-ai-pocket-codex.nathantaboract.workers.dev';
const privateRecords = new Map();

function element(tag, className, value) {
  const item = document.createElement(tag);
  if (className) item.className = className;
  if (value !== undefined) item.textContent = value;
  return item;
}

function renderRail(positions, selected, entries) {
  const rail = element('ol', 'rail');
  rail.setAttribute('aria-label', 'Project order');
  const position = positions.findIndex(item => item.id === selected.id);
  const start = positions.length <= 10 ? 0 : Math.max(0, Math.min(position - 4, positions.length - 8));
  const end = Math.min(positions.length, start + (positions.length <= 10 ? 10 : 8));
  if (start > 0) rail.append(element('li', 'ellipsis', '…'));
  for (const { id } of positions.slice(start, end)) {
    const entry = entries.get(id);
    const marker = element('li', id === selected.id ? 'active' : '', entry.marker);
    marker.title = entry.title;
    if (id === selected.id) marker.setAttribute('aria-current', 'true');
    rail.append(marker);
  }
  if (end < positions.length) rail.append(element('li', 'ellipsis', '…'));
  return rail;
}

function renderView(view, selected, entries, localText) {
  const section = element('section', 'panel');
  section.dataset.direction = view.direction;
  section.dataset.mirror = view.mirror;
  section.setAttribute('aria-label', view.directionLabel + ' · ' + view.mirrorLabel);
  section.append(element('h2', '', view.directionLabel), element('p', 'side', view.mirrorLabel));

  const plate = element('div', 'plate');
  const cross = element('span', 'cross', '×');
  cross.setAttribute('aria-hidden', 'true');
  const surface = element('div', 'surface');
  surface.dataset.rotate = view.rotation;
  surface.dataset.flip = view.flipGlyphs;
  const isOriginal = selected.number !== undefined;
  const marker = isOriginal ? 'CODEX ' + selected.number : 'PROJECT ' + selected.marker;
  const title = isOriginal ? selected.title.split(' · ').slice(1).join(' · ') || selected.title : selected.title;
  surface.append(element('span', 'source-number', marker), element('span', 'source-name', title));
  plate.append(cross, surface);
  section.append(plate, renderRail(view.positions, selected, entries));

  if (view.mirror === 'as-mirror') {
    const { position, counterpart } = view.positions.find(item => item.id === selected.id);
    section.append(element('p', 'coordinates', '(' + position.join(', ') + ') ↔ (' + counterpart.join(', ') + ')'));
  }
  if (localText !== undefined) {
    const excerpt = element('pre', 'excerpt', localText);
    excerpt.dataset.rotate = view.rotation;
    excerpt.dataset.flip = view.flipGlyphs;
    excerpt.tabIndex = 0;
    excerpt.setAttribute('aria-label', 'Original email text');
    section.append(excerpt);
  }
  return section;
}

function option(label, value) {
  const item = element('option', '', label);
  item.value = value;
  return item;
}

try {
  const response = await fetch(new URL('./api/collections', document.baseURI));
  if (!response.ok) throw new Error('Could not load collections.');
  const model = await response.json();
  const entries = new Map(model.entries.map(entry => [entry.id, entry]));
  const collections = new Map(model.collections.map(row => [row.id, row]));
  const plans = new Map(model.collections.map(row => [row.id, createViews(row.projects.map(id => entries.get(id)))]));
  const params = new URL(location.href).searchParams;
  const edit = byId('evidence');
  const detail = byId('source-title').closest('section');
  for (const group of collections.values()) {
    collectionSelect.append(option(group.title + ' (' + group.projects.length + ')', group.id));
  }
  collectionSelect.value = collections.has(params.get('collection')) ? params.get('collection') : 'originals';

  function render() {
    const group = collections.get(collectionSelect.value);
    const active = entries.get(select.value);
    const count = group.projects.length;
    const text = active ? privateRecords.get(active.id) : undefined;
    const selectedIndex = active ? group.projects.indexOf(active.id) + 1 : 0;
    status.textContent = active ? selectedIndex + ' of ' + count + ' in ' + group.title : 'No projects match this search.';
    if (privateRecords.size) status.textContent += ' · ' + privateRecords.size + ' local email' + (privateRecords.size === 1 ? ' open.' : 's open.');
    detail.hidden = !active;
    grid.hidden = !active;
    if (!active) return;
    const url = new URL(location.href);
    url.searchParams.set('collection', group.id);
    url.searchParams.set('entry', active.id);
    history.replaceState(null, '', url);
    grid.replaceChildren(...plans.get(group.id).map(view => renderView(view, active, entries, text)));
    byId('source-title').textContent = active.title;
    byId('source-status').textContent = active.status;
    byId('description').textContent = active.summary;
    byId('source-link').href = pocket + active.path;
    byId('source-link').hidden = false;
    edit.replaceChildren();
    edit.hidden = !active.evidence;
    if (active.evidence) {
      edit.append(element('strong', '', active.evidence.label), element('p', '', active.evidence.note));
      if (active.evidence.url) {
        const source = element('a', '', 'View source ↗');
        source.href = active.evidence.url;
        edit.append(source);
      }
    }
    byId('original').hidden = text === undefined;
    byId('original-body').textContent = text ?? '';
  }

  function selectProjects(preferred = select.value) {
    const group = collections.get(collectionSelect.value);
    const query = find.value.trim().toLowerCase();
    const matching = group.projects.map(id => entries.get(id)).filter(entry =>
      [entry.title, entry.id, entry.status, entry.summary].join(' ').toLowerCase().includes(query));
    select.replaceChildren(...matching.map(entry => option(entry.title, entry.id)));
    if (matching.some(entry => entry.id === preferred)) select.value = preferred;
    select.disabled = !matching.length;
    render();
  }

  collectionSelect.addEventListener('change', () => { find.value = ''; selectProjects(); });
  find.addEventListener('input', () => selectProjects());
  select.addEventListener('change', render);
  input.addEventListener('change', async () => {
    const [file] = input.files;
    if (!file) return;
    input.disabled = true;
    try {
      const records = await readLocalArchive(file);
      for (const [id, text] of records) privateRecords.set(id, text);
      if (!privateRecords.has(select.value)) {
        collectionSelect.value = 'originals';
        find.value = '';
        selectProjects(records.keys().next().value);
      } else render();
    } catch (error) {
      status.textContent = error.message;
    } finally {
      input.disabled = false;
      input.value = '';
    }
  });
  selectProjects(params.get('entry'));
  collectionSelect.disabled = false;
  find.disabled = false;
  input.disabled = false;
} catch {
  status.textContent = 'Could not load the Codex views. Reload to try again.';
}
