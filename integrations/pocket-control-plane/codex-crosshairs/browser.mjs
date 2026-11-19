import { readLocalArchive } from './local-archive.mjs';

const byId = id => document.getElementById(id);
const input = byId('archive');
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

function renderView(view, selected, entries, text) {
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
  surface.append(element('span', 'source-number', 'CODEX ' + selected.number));
  const title = selected.title.split(' · ').slice(1).join(' · ') || selected.title;
  surface.append(element('span', 'source-name', title));
  plate.append(cross, surface);
  section.append(plate);

  const rail = element('ol', 'rail');
  rail.setAttribute('aria-label', 'Codex order');
  for (const { id } of view.positions) {
    const number = element('li', id === selected.id ? 'active' : '', String(entries.get(id).number));
    if (id === selected.id) number.setAttribute('aria-current', 'true');
    rail.append(number);
  }
  section.append(rail);

  if (view.mirror === 'as-mirror') {
    const { position, counterpart } = view.positions.find(item => item.id === selected.id);
    section.append(element('p', 'coordinates', '(' + position.join(', ') + ') ↔ (' + counterpart.join(', ') + ')'));
  }

  if (text !== undefined) {
    const excerpt = element('pre', 'excerpt', text);
    excerpt.dataset.rotate = view.rotation;
    excerpt.dataset.flip = view.flipGlyphs;
    excerpt.tabIndex = 0;
    excerpt.setAttribute('aria-label', 'Original email text');
    section.append(excerpt);
  }
  return section;
}

try {
  const response = await fetch(new URL('./api/views', document.baseURI));
  if (!response.ok) throw new Error('Could not load the Codex views.');
  const { entries, views } = await response.json();
  const index = new Map(entries.map(entry => [entry.id, entry]));
  for (const entry of entries) {
    const option = element('option', '', entry.title);
    option.value = entry.id;
    select.append(option);
  }

  function render() {
    const selected = index.get(select.value);
    const text = privateRecords.get(selected.id);
    grid.replaceChildren(...views.map(view => renderView(view, selected, index, text)));
    byId('source-title').textContent = selected.title;
    byId('description').textContent = selected.summary;
    byId('source-link').href = pocket + selected.path;
    byId('source-link').hidden = false;
    byId('original-body').textContent = text ?? '';
    byId('original').hidden = text === undefined;
  }

  select.addEventListener('change', render);
  input.addEventListener('change', async () => {
    const [file] = input.files;
    if (!file) return;
    input.disabled = true;
    try {
      const records = await readLocalArchive(file);
      for (const [id, text] of records) privateRecords.set(id, text);
      if (!privateRecords.has(select.value)) select.value = records.keys().next().value;
      render();
      status.textContent = privateRecords.size + ' original ' +
        (privateRecords.size === 1 ? 'email open' : 'emails open') + ' on this device.';
    } catch (error) {
      status.textContent = error.message;
    } finally {
      input.disabled = false;
      input.value = '';
    }
  });

  render();
  select.disabled = false;
  input.disabled = false;
  status.textContent = 'Open the recovery ZIP to see the original email text in all nine views.';
} catch {
  status.textContent = 'Could not load the Codex views. Reload to try again.';
}
