(function () {
  'use strict';
  const api = window.NathanOutsideBox;
  const bundles = window.NathanOutsideBoxBundle;
  const el = id => document.getElementById(id);
  const reports = new Map();
  const decisions = [];
  const assessments = [];
  const outcomes = [];
  let shown = 40;
  let loading = false;
  let caseRecord = api.buildCase([]);
  const example = {
    schema: api.INPUT_SCHEMA,
    events: [
      { observedAt: '2026-11-18T14:00:00Z', asset: 'example.invalid / mailbox',
        principal: 'example-oauth-client', ingress: 'archive connector', stage: 'changed', family: 'O',
        sourceRef: 'example-consent-1', observation: 'A connected-app permission was granted in this synthetic record.' },
      { observedAt: '2026-11-18T14:05:00Z', asset: 'example.invalid / mailbox',
        principal: 'example-oauth-client', stage: 'accessed', family: 'O',
        sourceRef: 'example-audit-2', observation: 'A simulated mailbox read followed the permission grant.' }
    ]
  };

  function status(text) {
    el('status').textContent = text;
  }

  function option(list, value, label) {
    list.append(new Option(label, value));
  }

  function item(list, text) {
    const row = document.createElement('li');
    row.textContent = text;
    list.append(row);
    return row;
  }

  function download(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function format(event) {
    return [event.time + (event.clock === 'local-unzoned' ? ' (local time)' : ''),
      event.stage, event.asset, event.observation, event.sourceRef && 'Source reference ' + event.sourceRef]
      .filter(Boolean).join(' · ');
  }

  function selectedEvent() {
    return [...caseRecord.timeline, ...caseRecord.unzoned].find(event => event.id === el('event').value);
  }

  function showSelection() {
    const selected = selectedEvent();
    el('selected-observation').textContent = selected ? format(selected) : '';
    el('inspect').disabled = !selected;
    el('inspection').textContent = '';
    el('asset').readOnly = Boolean(selected?.asset);
    el('asset').value = selected?.asset || '';
    el('family').value = selected?.family || 'Z';
    showGuidance();
  }

  function showGuidance() {
    const family = api.PLAYBOOK.find(record => record.id === el('family').value);
    el('guidance').textContent = family?.action || '';
  }

  function fillSelect(id, values, key, label, placeholder) {
    const list = el(id);
    const selected = list.value;
    list.replaceChildren();
    option(list, '', placeholder);
    for (const value of values) option(list, key(value), label(value));
    if (values.some(value => key(value) === selected)) list.value = selected;
    list.disabled = !values.length;
  }

  function showTimeline() {
    const events = [...caseRecord.timeline, ...caseRecord.unzoned];
    el('timeline').replaceChildren();
    for (const event of events.slice(0, shown)) item(el('timeline'), format(event));
    el('show-more').hidden = events.length <= shown;
    el('unzoned-note').hidden = !caseRecord.unzoned.length;
  }

  function showDecisions() {
    const list = el('decision-list');
    list.replaceChildren();
    for (const a of assessments) {
      item(list, a.time + ' · ' + a.confidence + ' · ' + a.label + ' · ' + a.reason);
    }
    for (const d of decisions) {
      const latest = outcomes.filter(outcome => outcome.decisionId === d.id).at(-1);
      item(list, [d.time, api.ACTIONS[d.action], d.target, d.reason, d.check,
        latest && latest.status + ': ' + latest.evidence].filter(Boolean).join(' · '));
    }
    fillSelect('decision-ref', decisions, d => d.id, d => api.ACTIONS[d.action] + ' · ' + d.target, 'Select a decision');
    if (!el('decision-ref').value && decisions.length) el('decision-ref').value = decisions.at(-1).id;
    el('verify').disabled = !decisions.length;
  }

  function render() {
    caseRecord = api.buildCase([...reports.values()].map(value => value.report));
    const events = [...caseRecord.timeline, ...caseRecord.unzoned];
    for (const key of ['principals', 'ingress', 'assets']) {
      const values = caseRecord.observed[key];
      el(key).textContent = values.slice(0, 8).join(', ') + (values.length > 8 ? ' and ' + (values.length - 8) + ' more' : '') || '—';
    }
    el('attribution').textContent = events.length ? caseRecord.attribution : '—';
    el('impact').textContent = events.length
      ? Object.entries(caseRecord.impact).filter(([, n]) => n).map(([key, n]) => key + ' ' + n).join(' · ')
      : 'Import evidence to see the timeline.';
    el('source-list').replaceChildren();
    for (const { report, file } of reports.values()) {
      const source = report.source;
      const line = item(el('source-list'), source.name + ' · ' + source.kind + ' · SHA-256 ' + source.sha256 + ' ');
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = 'Download original';
      button.addEventListener('click', () => download(file, file.name));
      line.append(button);
    }
    showTimeline();
    fillSelect('event', events, event => event.id, event => format(event).slice(0, 185), 'Select supporting evidence');
    showSelection();
    showDecisions();
    for (const id of ['export', 'save-bundle', 'clear', 'review', 'decision']) el(id).disabled = !events.length;
  }

  async function addFiles(files) {
    if (loading) return;
    setFileBusy(true);
    let imported = 0;
    let duplicates = 0;
    const failures = [];
    try {
      for (const file of files) {
        try {
          if (file.size > api.MAX_BYTES) throw new Error('File exceeds 2 MiB.');
          const report = await api.importEvidence(file.name, new Uint8Array(await file.arrayBuffer()));
          if (reports.has(report.source.sha256)) {
            duplicates++;
            continue;
          }
          if (reports.size >= api.MAX_SOURCES) throw new Error('Case source limit reached.');
          reports.set(report.source.sha256, { report, file });
          imported++;
        } catch (error) {
          failures.push(file.name + ': ' + error.message);
        }
      }
      render();
      status([imported + ' file(s) imported.', duplicates && duplicates + ' duplicate(s) skipped.', ...failures].filter(Boolean).join(' '));
    } finally {
      el('evidence').value = '';
      setFileBusy(false);
    }
  }

  function setFileBusy(busy) {
    loading = busy;
    for (const id of ['evidence', 'open-bundle', 'load-example']) el(id).disabled = busy;
    for (const id of ['clear', 'save-bundle']) el(id).disabled = busy || !reports.size;
  }

  async function saveBundle() {
    if (loading) return;
    const current = caseRecord;
    const journal = { assessments: [...assessments], decisions: [...decisions], outcomes: [...outcomes] };
    setFileBusy(true);
    try {
      const sources = [];
      for (const [id, { file }] of reports) sources.push({ id, bytes: new Uint8Array(await file.arrayBuffer()) });
      const packed = await bundles.create(sources, current, journal);
      download(new Blob([packed], { type: 'application/zip' }), 'nathan-ai-outside-box-case.zip');
      status('Portable case prepared with original evidence and the decision journal.');
    } catch (error) {
      status(error.message);
    } finally {
      setFileBusy(false);
    }
  }

  async function openBundle(file) {
    if (loading || !file) return;
    setFileBusy(true);
    try {
      if (file.size > bundles.MAX_BYTES) throw new Error('Evidence bundle is too large.');
      const restored = await bundles.open(new Uint8Array(await file.arrayBuffer()));
      if (reports.size && !window.confirm('Replace the current in-memory case with the verified ZIP?')) return;
      reports.clear();
      for (const source of restored.sources) {
        const file = new File([source.bytes], source.report.source.name, { type: 'application/json' });
        reports.set(source.report.source.sha256, { report: source.report, file });
      }
      assessments.splice(0, assessments.length, ...restored.assessments);
      decisions.splice(0, decisions.length, ...restored.decisions);
      outcomes.splice(0, outcomes.length, ...restored.outcomes);
      el('reason').value = '';
      el('verification').value = '';
      el('authority').checked = false;
      shown = 40;
      render();
      status('Case reopened. Original fingerprints and journal references verified.');
    } catch (error) {
      status('Could not reopen case: ' + error.message);
    } finally {
      el('open-bundle').value = '';
      setFileBusy(false);
    }
  }

  function reviewInput() {
    return { evidenceId: el('event').value, reason: el('reason').value };
  }

  function record(id, fn, message) {
    el(id).addEventListener('click', () => {
      try {
        fn();
        showDecisions();
        status(message);
      } catch (error) {
        status(error.message);
      }
    });
  }

  for (const family of api.PLAYBOOK) {
    option(el('family'), family.id, family.id + ' · ' + family.title);
    item(el('playbook'), family.title + '. ' + family.action);
  }
  for (const [id, title] of Object.entries(api.ACTIONS)) option(el('action'), id, title);
  el('evidence').addEventListener('change', () => addFiles([...el('evidence').files]));
  el('load-example').addEventListener('click', () => {
    const file = new File([JSON.stringify(example)], 'outside-box-synthetic-example.json', { type: 'application/json' });
    addFiles([file]);
  });
  el('event').addEventListener('change', showSelection);
  el('save-bundle').addEventListener('click', saveBundle);
  el('open-bundle').addEventListener('change', () => openBundle(el('open-bundle').files[0]));
  el('inspect').addEventListener('click', () => {
    const selected = selectedEvent();
    if (!selected) return;
    const verdict = window.TaborHallOfMirrors.classify(selected.observation);
    el('inspection').textContent = verdict.detected
      ? 'Pattern flags for review: ' + verdict.reasons.join(', ')
      : 'No listed Hall of Mirrors pattern matched the selected observation.';
  });
  el('family').addEventListener('change', showGuidance);
  el('show-more').addEventListener('click', () => {
    shown += 40;
    showTimeline();
  });
  record('review', () => {
    assessments.push(api.recordReview(caseRecord, { ...reviewInput(),
      family: el('family').value, confidence: el('confidence').value }));
  }, 'Owner assessment recorded.');
  record('decision', () => {
    decisions.push(api.recordDecision(caseRecord, { ...reviewInput(), action: el('action').value,
      asset: el('asset').value, ownerConfirmed: el('authority').checked }));
    el('authority').checked = false;
  }, 'Decision recorded. Apply it through your management console.');
  record('verify', () => {
    const decision = decisions.find(entry => entry.id === el('decision-ref').value);
    if (!decision) throw new Error('Choose a recorded decision.');
    outcomes.push(api.recordOutcome(decision, { status: el('outcome').value, evidence: el('verification').value }));
    el('verification').value = '';
  }, 'Owner verification outcome recorded.');
  el('export').addEventListener('click', () => {
    const packet = { ...caseRecord, exportedAt: new Date().toISOString(), assessments, decisions, outcomes };
    download(new Blob([JSON.stringify(packet, null, 2)], { type: 'application/json' }), 'nathan-ai-outside-box-case.json');
    status('Case export prepared. It contains imported observations and owner notes.');
  });
  el('clear').addEventListener('click', () => {
    if (!window.confirm('Clear the current local case and its unsaved notes?')) return;
    reports.clear();
    decisions.length = assessments.length = outcomes.length = 0;
    shown = 40;
    for (const id of ['reason', 'verification', 'asset']) el(id).value = '';
    el('authority').checked = false;
    render();
    status('Current case cleared.');
  });
  render();
})();
