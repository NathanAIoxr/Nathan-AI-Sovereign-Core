(function () {
  'use strict';
  const E = window.NathanTurnaround;
  if (!E) return;
  let state = E.initialState();
  let registry = null;
  let nodeFirst = 1;
  function renderNodePage() {
    const select = byId('node-tier-select');
    const output = byId('node-page');
    if (!select || !output || !registry) return;
    const tier = registry.node_tiers.find(t => t.id === select.value);
    if (!tier) return;
    const page = E.virtualPage(tier, nodeFirst, 20);
    output.textContent = page.indexes.map(x => x.id).join(' · ') || 'No additional virtual positions.';
    byId('node-index-state').textContent =
      tier.numeric_source + ' symbolic indexes · showing ' + (page.indexes.length ? page.first : 0) +
      '–' + (page.indexes.at(-1)?.ordinal || 0) + ' · zero live computing nodes launched';
    byId('node-prev').disabled = page.first <= 1;
    byId('node-next').disabled = page.next === null;
  }
  const byId = id => document.getElementById(id);
  const el = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  };
  const status = message => { byId('status').textContent = message; };
  function render() {
    byId('heading').textContent = state.heading + '°';
    byId('direction').textContent = state.direction;
    byId('phase').textContent = 'Axis ' + (state.axis === 1 ? '+1' : '−1');
    byId('brakes').textContent = state.emergencyBrakes ? 'ENGAGED' : 'DISENGAGED';
    byId('anchors').textContent = state.anchorsDropped ? 'DROPPED' : 'RAISED';
    byId('hatches').textContent = state.hatchesSecured ? 'SECURED' : 'OPEN';
    byId('misfits').textContent = state.misfitNodes.replaceAll('_', ' ');
    byId('operation').textContent = state.operation;
    byId('intensity-value').textContent = state.visualIntensity + '% visual only';
    byId('intensity').value = String(state.visualIntensity);
    byId('center-point').style.transform = 'rotate(' + state.heading + 'deg)';
    byId('center-point').setAttribute('aria-label', 'Simulation heading ' + state.heading + ' degrees; core is symbolic');
    const values = E.spectrum(state);
    for (const key of E.CHANNELS) {
      byId(key + '-bar').style.width = values[key] + '%';
      byId(key + '-number').textContent = values[key] + ' / 100 illustrative units';
    }
    const queue = byId('queue-list');
    queue.replaceChildren();
    for (const item of E.convoyPreview(state)) {
      const li = el('li', item.position + '. ' + item.title + (item.reviewed ? ' ✓ reviewed' : ' · review needed'));
      if (!item.reviewed) {
        const b = el('button', 'Mark reviewed');
        b.type = 'button';
        b.addEventListener('click', () => dispatch({ type: 'REVIEW_ITEM', id: item.id }));
        li.append(' ', b);
      }
      queue.appendChild(li);
    }
    byId('ram-output').textContent = E.ramPreview(state).length
      ? E.ramPreview(state).map(x => x.bottleneck + ': ' + x.proposal).join('\n')
      : 'No locally queued unresolved bottlenecks.';
    byId('log').textContent = state.events.slice(-10).map(e =>
      '#' + e.revision + ' ' + e.type + ' — ' + e.details).join('\n') || 'No simulated events yet.';
    renderShadow();
  }
  function renderShadow() {
    const input = byId('shadow-input').value;
    const s = E.shadowViews(input);
    byId('shadow-original').textContent = s.original || '(empty)';
    byId('shadow-characters').textContent = s.reversedCharacters || '(empty)';
    byId('shadow-words').textContent = s.reversedWords || '(empty)';
    byId('shadow-initials').textContent = s.firstLetters || '(empty)';
  }
  function dispatch(event) {
    try {
      state = E.transition(state, event);
      render();
      status(event.type === 'WHIPLASH_TEST' ? state.events.at(-1).details : event.type + ' — local simulation updated; no live activation');
    } catch (err) { status('Not applied: ' + err.message); }
  }
  function showTaxonomy(data) {
    const tiers = byId('node-tiers');
    tiers.replaceChildren();
    for (const item of data.node_tiers) {
      const article = el('article', undefined, 'tier');
      article.append(el('strong', item.numeric_source), el('span', item.label),
        el('small', item.interpretation));
      tiers.appendChild(article);
    }
    const categories = byId('category-collections');
    categories.replaceChildren();
    const groups = [
      ['sovereign_apps', 'Sovereign Light Apps'],
      ['strategic_games', 'Strategic Games'],
      ['macro_projects', 'Real-World Tabor Engines']
    ];
    for (const [key, title] of groups) {
      const details = el('details');
      const summary = el('summary', title + ' — ' + data.categories[key].length + ' classifications');
      details.appendChild(summary);
      const list = el('ul');
      for (const item of data.categories[key]) {
        const li = el('li');
        li.append(el('strong', item.name));
        if (item.examples && item.examples.length) li.append(el('p', item.examples.join(' · ')));
        list.appendChild(li);
      }
      details.appendChild(list);
      categories.appendChild(details);
    }
    renderNodePage();
    byId('source-status').textContent =
      '101 Personal Intelligence elements: creator-defined goal; the complete 101-item source inventory has not been provided in this registry.';
  }
  for (const b of document.querySelectorAll('[data-event]')) {
    b.addEventListener('click', () => dispatch({ type: b.dataset.event, value: b.dataset.value }));
  }
  byId('intensity').addEventListener('input', event => dispatch({
    type: 'SET_VISUAL_INTENSITY', value: event.target.value
  }));
  byId('queue-form').addEventListener('submit', event => {
    event.preventDefault();
    dispatch({ type: 'QUEUE_ITEM', title: byId('queue-title').value });
    byId('queue-title').value = '';
  });
  byId('shadow-input').addEventListener('input', renderShadow);
  byId('node-tier-select').addEventListener('change', () => { nodeFirst = 1; renderNodePage(); });
  byId('node-prev').addEventListener('click', () => { nodeFirst = Math.max(1, nodeFirst - 20); renderNodePage(); });
  byId('node-next').addEventListener('click', () => { nodeFirst += 20; renderNodePage(); });
  byId('export').addEventListener('click', () => {
    const body = JSON.stringify({
      schema: 'nathan-ai:turnaround:local-export-v1',
      warning: 'Simulation only. No hardware/network activity.',
      state, shadow: E.actPreview(byId('shadow-input').value),
      registry: registry ? { title: registry.title, source_principles: registry.source_principles } : null
    }, null, 2);
    const url = URL.createObjectURL(new Blob([body], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'nathan-turnaround-local-session.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    status('JSON export prepared in your browser; no server upload');
  });
  render();
  fetch('./registry.json', { cache: 'no-store' })
    .then(r => { if (!r.ok) throw Error('Registry unavailable'); return r.json(); })
    .then(data => { registry = data; showTaxonomy(data); })
    .catch(() => { byId('source-status').textContent = 'Local registry unavailable; open from the hosted application path.'; });
})();
