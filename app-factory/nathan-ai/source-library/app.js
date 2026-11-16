'use strict';

const SNAPSHOT_SCHEMA = 'nathan-ai.source-snapshot.v1';
const MAX_BYTES = 5 * 1024 * 1024;

function readSnapshot(input) {
  if (input?.schema !== SNAPSHOT_SCHEMA || !/^\d{4}-\d{2}-\d{2}$/.test(input.date) ||
      !Array.isArray(input.records) || input.records.length > 10000) {
    throw Error('Choose a Nathan AI source snapshot with a date and up to 10,000 records.');
  }
  const ids = new Set();
  const records = input.records.map(record => {
    const { id, title, source, status, url } = record ?? {};
    if (![id, title, source, status].every(value => typeof value === 'string' && value.trim()) || ids.has(id)) {
      throw Error('Each record needs a unique identifier, title, source, and status.');
    }
    if (url !== undefined) {
      const link = new URL(url);
      if (link.protocol !== 'https:' || link.username || link.password) throw Error('A source URL must be HTTPS.');
    }
    ids.add(id);
    return { id, title, source, status, url };
  });
  const authorText = input.authorText ?? '';
  if (typeof authorText !== 'string') throw Error('Original wording must be text.');
  return { date: input.date, authorText, records };
}

function search(records, query, source = '') {
  const words = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  return records.filter(record => {
    if (source && record.source !== source) return false;
    const haystack = [record.id, record.title, record.source, record.status, record.group, record.description]
      .join(' ').toLocaleLowerCase();
    return words.every(word => haystack.includes(word));
  });
}

function mount() {
  const byId = id => document.getElementById(id);
  const element = (tag, text) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    return node;
  };
  let roots = [];
  let snapshot;
  let limit = 24;
  let loadRequest = 0;

  function renderRoots() {
    const found = search(roots, byId('root-filter').value);
    byId('root-count').textContent = found.length + ' of ' + roots.length + ' root blocks';
    byId('root-list').replaceChildren(...found.map(record => {
      const item = element('li');
      const detail = element('details');
      const summary = element('summary');
      summary.append(element('code', record.id.slice(-2)), element('span', record.title));
      detail.append(summary, element('h3', record.group), element('p', record.description));
      item.append(detail);
      return item;
    }));
  }

  async function loadRoots() {
    try {
      const response = await fetch('./roots.json');
      if (!response.ok) throw Error('Catalog unavailable');
      roots = (await response.json()).records;
      renderRoots();
      byId('root-filter').addEventListener('input', renderRoots);
    } catch {
      byId('root-count').textContent = 'The root catalog could not load. Reload the page to retry.';
    }
  }

  function renderBoxes() {
    const boxes = window.SovereignBoxes.boxText(byId('box-input').value);
    byId('character-boxes').replaceChildren(...boxes.map(box => {
      const item = element('li');
      item.append(element('code', box.value === ' ' ? '␣' : box.value), element('small', String(box.index + 1)));
      item.title = box.boxId + ' · U+' + box.codepoint.toString(16).toUpperCase().padStart(4, '0');
      return item;
    }));
  }

  function renderSnapshot() {
    const records = search(snapshot.records, byId('record-filter').value, byId('source-filter').value);
    byId('record-count').textContent = records.length.toLocaleString() + ' matching source records';
    byId('record-list').replaceChildren(...records.slice(0, limit).map(record => {
      const item = element('li');
      const title = element(record.url ? 'a' : 'strong', record.title);
      if (record.url) {
        title.href = record.url;
        title.target = '_blank';
        title.rel = 'noopener noreferrer';
      }
      item.append(title, element('p', [record.id, record.source, record.status].join(' · ')));
      return item;
    }));
    byId('more-records').hidden = records.length <= limit;
  }

  function openSnapshot(next) {
    snapshot = next;
    byId('record-filter').value = '';
    const sources = [...new Set(next.records.map(record => record.source))].sort();
    const options = ['', ...sources].map(source => {
      const option = element('option', source || 'All sources');
      option.value = source;
      return option;
    });
    byId('source-filter').replaceChildren(...options);
    byId('source-filter').value = '';
    byId('snapshot-date').textContent = 'Cataloged ' + next.date;
    byId('author-source').hidden = !next.authorText;
    byId('author-text').textContent = next.authorText;
    limit = 24;
    renderSnapshot();
    byId('owner').hidden = false;
    byId('record-filter').focus();
  }

  byId('owner-pack').addEventListener('change', async event => {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;
    const request = ++loadRequest;
    try {
      if (file.size > MAX_BYTES) throw Error('Snapshot exceeds 5 MB.');
      const next = readSnapshot(JSON.parse(await file.text()));
      if (request !== loadRequest) return;
      openSnapshot(next);
      byId('pack-status').textContent = file.name + ' opened in this tab.';
    } catch (error) {
      if (request === loadRequest) byId('pack-status').textContent = 'Could not open snapshot. ' + error.message;
    }
  });

  byId('close-pack').addEventListener('click', () => {
    loadRequest++;
    snapshot = undefined;
    byId('owner').hidden = true;
    for (const id of ['record-list', 'source-filter', 'author-text', 'record-count', 'snapshot-date']) byId(id).replaceChildren();
    byId('record-filter').value = '';
    byId('pack-status').textContent = 'Snapshot closed.';
    byId('owner-pack').focus();
  });

  for (const id of ['record-filter', 'source-filter']) {
    byId(id).addEventListener('input', () => {
      limit = 24;
      renderSnapshot();
    });
  }
  byId('more-records').addEventListener('click', () => {
    limit += 24;
    renderSnapshot();
  });

  byId('box-input').addEventListener('input', renderBoxes);
  renderBoxes();
  loadRoots();
}

if (typeof module === 'object' && module.exports) module.exports = { readSnapshot, search };
else mount();
