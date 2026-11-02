/* Nathan AI recovery atlas. Additive public metadata, owner-selected source stays in this tab. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const state = { base: [], local: [], limit: 48, query: '', kind: '', category: '', status: '' };
  const elt = (tag, value) => {
    const node = document.createElement(tag);
    if (value !== undefined) node.textContent = String(value);
    return node;
  };
  const sourceLink = (row, label, href) => {
    if (!href) return null;
    const a = elt('a', label);
    a.href = href;
    if (/^https:/.test(href)) {
      a.rel = 'noopener noreferrer';
      a.target = '_blank';
    }
    return a;
  };
  function rowsFrom(registry, games) {
    const interfaces = registry.interfaces.map(x => ({
      kind: 'interface', name: x.name, category: x.category, status: x.status,
      detail: x.path, href: x.href, source_url: x.source_url
    }));
    const gameRows = games.map(x => ({
      kind: 'game', name: x.title, category: x.category, status: x.stage,
      detail: 'Existing original Games Atlas title; consult its own source and lifecycle stage.',
      href: x.href ? '../games/' + x.href : '../games/index.html',
      source_url: null
    }));
    const systems = registry.systems.map(x => ({
      kind: 'system', name: x.name, category: x.category, status: x.status,
      detail: x.source, href: x.href || null, source_url: null
    }));
    const anchors = registry.archive_anchors.map(x => ({
      kind: 'archive', name: x.name, category: x.category, status: x.status,
      detail: x.description, href: null, source_url: null
    }));
    return [...interfaces, ...gameRows, ...systems, ...anchors];
  }
  function redrawFilters() {
    const all = [...state.base, ...state.local];
    const categories = [...new Set(all.map(x => x.category))].sort();
    const statuses = [...new Set(all.map(x => x.status))].sort();
    for (const [id, options, initial] of [['category', categories, 'All categories'], ['status', statuses, 'All lifecycle stages']]) {
      const sel = $(id), prev = sel.value;
      sel.replaceChildren();
      const empty = elt('option', initial); empty.value = ''; sel.append(empty);
      for (const value of options) { const o = elt('option', value); o.value = value; sel.append(o); }
      if (options.includes(prev)) sel.value = prev;
      else { sel.value = ''; state[id] = ''; }
    }
  }
  function selectedRows() {
    const q = state.query.toLocaleLowerCase();
    return [...state.base, ...state.local].filter(x =>
      (!state.kind || x.kind === state.kind) &&
      (!state.category || x.category === state.category) &&
      (!state.status || x.status === state.status) &&
      (!q || [x.name, x.category, x.status, x.detail, x.searchText || ''].join(' ').toLocaleLowerCase().includes(q))
    );
  }
  function render() {
    const matches = selectedRows();
    const list = $('records');
    list.replaceChildren();
    for (const row of matches.slice(0, state.limit)) {
      const article = elt('article'); article.className = 'card';
      const kind = elt('div', row.kind + ' · ' + row.status); kind.className = 'eyebrow';
      const title = elt('h3', row.name);
      const group = elt('small', row.category);
      const description = elt('p', row.detail || 'Original source details remain in its own project.');
      article.append(kind, title, group, description);
      const goto = sourceLink(row, row.kind === 'interface' ? 'Open existing route (if published)' :
        row.kind === 'game' ? 'Open Games Atlas / game route' : 'Open original module', row.href);
      if (goto) article.append(goto);
      const source = sourceLink(row, 'View source code', row.source_url);
      if (source) article.append(source);
      if (row.file) {
        const button = elt('button', 'Download selected original');
        button.type = 'button';
        button.addEventListener('click', () => {
          const url = URL.createObjectURL(row.file);
          const a = elt('a'); a.href = url; a.download = row.file.name;
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), 60000);
        });
        article.append(button);
        if (row.searchText) {
          const details = elt('details');
          const summary = elt('summary', 'View local text preview');
          const pre = elt('pre', row.searchText.slice(0, 6000) + (row.searchText.length > 6000 ? '\n…preview clipped; original remains unchanged' : ''));
          details.append(summary, pre); article.append(details);
        }
      }
      list.append(article);
    }
    $('results-status').textContent = matches.length.toLocaleString() + ' matching records · ' +
      Math.min(state.limit, matches.length).toLocaleString() + ' shown · ' +
      state.base.length.toLocaleString() + ' public references + ' + state.local.length + ' owner-selected files';
    $('more').hidden = matches.length <= state.limit;
    if (!matches.length) list.append(elt('p', 'No matching source record. Try another search, or select an original file using the owner-source control.'));
  }
  function watchFilters() {
    for (const id of ['kind', 'category', 'status']) {
      $(id).addEventListener('change', () => { state[id] = $(id).value; state.limit = 48; render(); });
    }
    $('q').addEventListener('input', () => { state.query = $('q').value.trim(); state.limit = 48; render(); });
    $('more').addEventListener('click', () => { state.limit += 48; render(); });
  }
  async function load() {
    try {
      const [a, b] = await Promise.all([
        fetch('./registry.json', {cache:'no-store'}),
        fetch('../games/catalog.json', {cache:'no-store'})
      ]);
      if (!a.ok || !b.ok) throw Error('Missing source index (HTTP ' + a.status + '/' + b.status + ')');
      const registry = await a.json();
      const catalog = await b.json();
      if (registry.schema !== 'nathan-ai.build-recovery.v1' ||
          !Array.isArray(registry.interfaces) || !Array.isArray(registry.systems) ||
          !Array.isArray(registry.archive_anchors) || !Array.isArray(catalog.entries))
        throw Error('Invalid archive index format');
      state.base = rowsFrom(registry, catalog.entries);
      $('page-count').textContent = registry.interfaces.length.toLocaleString();
      $('game-count').textContent = catalog.entries.length.toLocaleString();
      $('system-count').textContent = registry.systems.length.toLocaleString();
      $('archive-count').textContent = registry.archive_anchors.length.toLocaleString();
      $('source-meta').textContent = 'Version: ' + registry.schema + ' · Snapshot: ' + registry.as_of +
        ' · Public source paths and prior recovery metadata only; private archives are not imported automatically.';
      redrawFilters(); render();
    } catch (err) {
      $('results-status').textContent = 'The public catalog did not load: ' + err.message + '. Existing links above still work.';
      $('source-meta').textContent = 'Static GitHub Pages or HTTP serving is needed for JSON loading. Opening this HTML directly as file:// may block fetch.';
    }
  }
  async function ownerImport(files) {
    const selected = Array.from(files || []).slice(0, 40);
    let added = 0;
    for (const file of selected) {
      if (state.local.some(x => x.file === file)) continue;
      const readable = /\.(txt|md|markdown|csv|tsv|json|html|py|js|cjs|mjs|xml|yaml|yml)$/i.test(file.name);
      let searchText = '';
      if (readable && file.size <= 8 * 1024 * 1024) {
        try { searchText = await file.text(); } catch (_) { searchText = ''; }
      }
      state.local.push({
        kind: 'owner', name: file.name, category: 'Owner-selected sources',
        status: 'tab-only, original unchanged',
        detail: file.size.toLocaleString() + ' bytes · original file · ' +
          (searchText ? 'local text search available' : 'binary / over-limit / unreadable preview'),
        searchText, file, href: null, source_url: null
      }); added += 1;
    }
    $('owner-status').textContent = state.local.length + ' selected source file(s) in this tab. ' +
      (added ? added + ' newly included. ' : '') + 'Nothing uploaded or published.';
    $('clear-owner').disabled = !state.local.length;
    redrawFilters(); render();
  }
  $('owner-import').addEventListener('change', e => {
    ownerImport(e.target.files).catch(() => { $('owner-status').textContent = 'One or more selected files could not be read in this browser.'; });
  });
  $('clear-owner').addEventListener('click', () => {
    state.local = [];
    $('owner-import').value = '';
    $('owner-status').textContent = 'Owner-selected files cleared from this tab view.';
    $('clear-owner').disabled = true;
    redrawFilters(); render();
  });
  watchFilters();
  load();
})();
