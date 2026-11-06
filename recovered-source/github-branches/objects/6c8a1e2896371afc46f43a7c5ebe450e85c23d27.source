(function () {
  'use strict';
  const engine = window.NathanCapabilities;
  const byId = id => document.getElementById(id);
  const els = {
    query: byId('query'), scope: byId('scope'), capability: byId('capability'),
    type: byId('type'), stats: byId('stats'), status: byId('status'),
    results: byId('results'), count: byId('count'), more: byId('more')
  };
  const repo = 'NathanAIoxr/Nathan-AI-Sovereign-Core';
  let inventory = null, records = [], shown = 0, matching = [];
  function addSelect(select, values) {
    values.sort((a, b) => a.localeCompare(b)).forEach(value => {
      const option = document.createElement('option');
      option.value = value; option.textContent = value; select.appendChild(option);
    });
  }
  function e(tag, text, cls) {
    const item = document.createElement(tag);
    if (text !== undefined) item.textContent = String(text);
    if (cls) item.className = cls;
    return item;
  }
  function showStats() {
    const summary = engine.summary(records);
    els.stats.replaceChildren();
    const stats = [
      [inventory.fileCount, 'Snapshot files'],
      [inventory.directoryCount, 'Snapshot directories'],
      [summary.sourceScanned, 'Files source-inspected here'],
      [summary.runtimeVerified, 'Runtime-verified by this tool']
    ];
    for (const [value, label] of stats) {
      const tile = e('div', undefined, 'stat'), n = e('strong', Number(value).toLocaleString()), caption = e('small', label);
      tile.append(n, caption); els.stats.appendChild(tile);
    }
  }
  function selections() {
    return { query: els.query.value, scope: els.scope.value, capability: els.capability.value, type: els.type.value };
  }
  function refresh(reset) {
    if (reset) shown = 0;
    matching = engine.search(records, selections());
    els.results.replaceChildren();
    els.count.textContent = matching.length.toLocaleString() + ' matching entries';
    addNextPage();
  }
  function tag(text, observed) {
    return e('span', text, 'tag' + (observed ? ' observed' : ''));
  }
  function addNextPage() {
    const batch = matching.slice(shown, shown + 75);
    for (const record of batch) {
      const card = e('article', undefined, 'item');
      card.appendChild(e('div', record.path, 'path'));
      card.appendChild(e('small', record.scope + ' · ' + record.type + ' · ' + record.bytes.toLocaleString() + ' bytes'));
      const candidates = e('div');
      candidates.append(e('small', 'Path-based candidates: '));
      if (!record.candidates.length) candidates.append(tag('Not yet classified'));
      else record.candidates.forEach(id => candidates.append(tag(id)));
      card.appendChild(candidates);
      if (record.evidenceLevel === 'static-source-scanned') {
        const observed = e('div');
        observed.append(e('small', 'Static source signals: '));
        if (!record.observed.length) observed.append(tag('None detected'));
        else record.observed.forEach(id => observed.append(tag(id, true)));
        card.appendChild(observed);
        card.appendChild(e('small', record.evidence.map(x => x.signal).join(' · ')));
      }
      card.appendChild(e('div', 'Evidence: ' + record.evidenceLevel + ' · Not runtime-verified', 'meta'));
      const actions = e('div', undefined, 'actions');
      if (record.entryType === 'f') {
        const link = e('a', 'View source on GitHub');
        link.href = 'https://github.com/' + repo + '/blob/main/' + record.path.split('/').map(encodeURIComponent).join('/');
        link.target = '_blank'; link.rel = 'noopener noreferrer'; actions.append(link);
      }
      if (record.entryType === 'f' && /\.(?:js|mjs|cjs|ts|tsx|jsx|py|swift|ino|sql|sh|html|css|yml|yaml)$/i.test(record.path) && record.bytes <= 300000) {
        const inspect = e('button', record.evidenceLevel === 'static-source-scanned' ? 'Inspect again' : 'Inspect source signals');
        inspect.type = 'button';
        inspect.addEventListener('click', async () => {
          inspect.disabled = true;
          inspect.textContent = 'Inspecting…';
          try {
            const url = '../../../' + record.path.split('/').map(encodeURIComponent).join('/');
            const response = await fetch(url, {cache: 'no-store'});
            if (!response.ok) throw new Error('Source could not be loaded (HTTP ' + response.status + ')');
            const text = await response.text();
            if (text.length > 500000) throw new Error('File exceeds the browser inspection limit');
            const pos = records.findIndex(r => r.path === record.path);
            if (pos < 0) throw new Error('Record missing from current inventory');
            records[pos] = engine.analyzeText(inventory.entries[pos], text);
            els.status.textContent = 'Static source inspection completed for ' + record.path + '. Results are code signals, not proof of execution.';
            showStats(); refresh(true);
          } catch (error) {
            inspect.disabled = false;
            inspect.textContent = 'Retry source inspection';
            els.status.textContent = 'Source inspection unavailable: ' + error.message;
          }
        });
        actions.append(inspect);
      }
      card.appendChild(actions); els.results.appendChild(card);
    }
    shown += batch.length;
    els.more.hidden = shown >= matching.length;
  }
  function download(name, content, mime) {
    const blob = new Blob([content], {type: mime});
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob); link.download = name;
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }
  function quoteCsv(value) { return '"' + String(value === undefined ? '' : value).replace(/"/g, '""') + '"'; }
  function exportRows(asCsv) {
    if (asCsv) {
      const cols = ['path','scope','type','bytes','gitSha','evidenceLevel','candidates','observed','runtimeVerified'];
      const output = [cols.join(',')];
      for (const row of matching) output.push(cols.map(c => quoteCsv(Array.isArray(row[c]) ? row[c].join('|') : row[c])).join(','));
      download('nathan-ai-capabilities.csv', output.join('\r\n'), 'text/csv;charset=utf-8');
    } else {
      download('nathan-ai-capabilities.json', JSON.stringify({
        schema: 'nathan-ai.capabilities.export.v1',
        sourceRepository: repo, baseCommit: inventory.baseCommit,
        method: 'Path candidates; inspected code signals are not verified runtime behavior',
        formulas: engine.FORMULAS, records: matching
      }, null, 2), 'application/json');
    }
  }
  async function start() {
    try {
      if (!engine) throw new Error('Analysis engine did not load');
      const response = await fetch('inventory.json', {cache:'no-store'});
      if (!response.ok) throw new Error('Inventory unavailable (HTTP ' + response.status + ')');
      inventory = await response.json();
      if (inventory.schema !== 'nathan-ai.capability-atlas.inventory.v1' || !Array.isArray(inventory.entries))
        throw new Error('Unexpected inventory schema');
      records = inventory.entries.map(engine.fromPath);
      if (records.length !== inventory.entryCount) throw new Error('Inventory count mismatch');
      const summary = engine.summary(records);
      addSelect(els.scope, Object.keys(summary.byScope));
      addSelect(els.type, Object.keys(summary.byType));
      for (const item of engine.CAPABILITIES) {
        const option = e('option', item.title);
        option.value = item.id; els.capability.append(option);
      }
      els.status.textContent = 'Inventory loaded from GitHub tree ' + inventory.baseCommit.slice(0, 12) + '. All snapshot paths indexed. Inspection is read-only.';
      [els.query, els.scope, els.capability, els.type].forEach(el => el.addEventListener(el === els.query ? 'input' : 'change', () => refresh(true)));
      els.more.addEventListener('click', addNextPage);
      byId('export-json').addEventListener('click', () => exportRows(false));
      byId('export-csv').addEventListener('click', () => exportRows(true));
      byId('reset').addEventListener('click', () => {
        els.query.value = ''; els.scope.value = 'All'; els.capability.value = 'All'; els.type.value = 'All'; refresh(true);
      });
      showStats(); refresh(true);
    } catch (error) {
      els.stats.textContent = 'Repository inventory could not be loaded.';
      els.status.textContent = error.message + '. Open through the hosted app or a local web server, not as a file:// document.';
      els.more.hidden = true;
    }
  }
  start();
})();
