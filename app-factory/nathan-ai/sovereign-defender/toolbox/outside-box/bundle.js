/* Portable, exact-source Outside Box case, using the Universal Creator Vault. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./engine.js'), require('../../../../vault-backup.js'));
  } else {
    root.NathanOutsideBoxBundle = factory(root.NathanOutsideBox, root.TaborVaultBackup);
  }
})(globalThis, function (api, vault) {
  'use strict';
  const SCHEMA = 'nathan-ai.outside-box.bundle.v1';
  const JOURNAL_ID = 'outside-box-case-journal';
  const MAX_JOURNAL = 2 * 1024 * 1024;
  const MAX_BYTES = api.MAX_BYTES * api.MAX_SOURCES + MAX_JOURNAL + 8192;
  const encoder = new TextEncoder();
  const decoder = new TextDecoder('utf-8', { fatal: true });

  function entries(value) {
    if (!Array.isArray(value) || value.length > 500) throw new Error('Case journal has too many entries.');
    return value;
  }

  function recordedTime(value) {
    if (typeof value !== 'string') throw new Error('Case journal timestamp is missing.');
    const date = new Date(value);
    if (!Number.isFinite(date.valueOf()) || date.toISOString() !== value) throw new Error('Invalid case journal timestamp.');
    return value;
  }

  function restoreJournal(caseRecord, journal) {
    const assessments = entries(journal.assessments).map(entry => ({
      ...api.recordReview(caseRecord, entry), time: recordedTime(entry.time)
    }));
    const decisions = entries(journal.decisions).map(entry => {
      if (typeof entry.id !== 'string' || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(entry.id)) {
        throw new Error('Invalid decision reference in case journal.');
      }
      const result = api.recordDecision(caseRecord, {
        evidenceId: entry.evidenceId, action: entry.action, reason: entry.reason, asset: entry.target,
        ownerConfirmed: true
      });
      if (result.target !== entry.target) throw new Error('Decision scope differs from the original evidence.');
      return { ...result, id: entry.id, time: recordedTime(entry.time) };
    });
    const byId = new Map(decisions.map(decision => [decision.id, decision]));
    if (byId.size !== decisions.length) throw new Error('Duplicate decision reference in case journal.');
    const outcomes = entries(journal.outcomes).map(entry => {
      const decision = byId.get(entry.decisionId);
      if (!decision) throw new Error('Outcome is missing its recorded decision.');
      return { ...api.recordOutcome(decision, entry), time: recordedTime(entry.time) };
    });
    return { assessments, decisions, outcomes };
  }

  async function create(sources, caseRecord, journal) {
    if (!caseRecord.sources.length || sources.length !== caseRecord.sources.length) {
      throw new Error('The bundle needs every original evidence source.');
    }
    if (sources.length > api.MAX_SOURCES) throw new Error('Case source limit reached.');
    const sourceMap = new Map(caseRecord.sources.map(source => [source.sha256, source]));
    const used = new Set();
    const originals = sources.map(({ id, bytes }) => {
      const source = sourceMap.get(id);
      if (!source || used.has(id) || bytes.length !== source.bytes) throw new Error('Evidence source does not match the case.');
      used.add(id);
      return { record: { id, name: source.name, sha256: source.sha256 }, bytes };
    });
    const clean = restoreJournal(caseRecord, journal);
    const bytes = encoder.encode(JSON.stringify({ schema: SCHEMA, ...clean }));
    if (bytes.length > MAX_JOURNAL) throw new Error('Case journal exceeds 2 MiB.');
    const packed = await vault.create([...originals, { record: { id: JOURNAL_ID, name: 'case-journal.json' }, bytes }]);
    return packed.bytes;
  }

  async function open(bytes) {
    if (!(bytes instanceof Uint8Array) || bytes.length > MAX_BYTES) throw new Error('Evidence bundle is too large.');
    const vaultData = await vault.parse(bytes);
    if (vaultData.items.length < 2 || vaultData.items.length > api.MAX_SOURCES + 1) {
      throw new Error('Outside Box bundle source count is invalid.');
    }
    const journal = vaultData.items.find(item => item.record.id === JOURNAL_ID);
    if (!journal || journal.bytes.length > MAX_JOURNAL) throw new Error('Outside Box bundle journal is missing or too large.');
    const data = JSON.parse(decoder.decode(journal.bytes));
    if (data.schema !== SCHEMA) throw new Error('Unknown Outside Box bundle format.');
    const sources = [];
    for (const original of vaultData.items.filter(item => item !== journal)) {
      const report = await api.importEvidence(original.record.name, original.bytes);
      if (report.source.sha256 !== original.record.id) throw new Error('Original reference differs from the computed fingerprint.');
      sources.push({ report, bytes: original.bytes });
    }
    const caseRecord = api.buildCase(sources.map(source => source.report));
    return { sources, ...restoreJournal(caseRecord, data) };
  }

  return Object.freeze({ MAX_BYTES, create, open });
});
