const text = new TextEncoder();
const utf8 = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true });
const shaPattern = /^[a-f0-9]{64}$/;
const idPattern = /^[a-z0-9][a-z0-9.-]{0,127}$/;
export const axes = Object.freeze(['attributes', 'characteristics', 'functionality', 'traits', 'energy', 'harmony', 'frequency']);
export const bodies = Object.freeze(['natural', 'soul', 'spirit', 'shadow', 'dead', 'alive', 'mind']);
export const planes = Object.freeze(['below', 'middle', 'above']);
const kinds = ['quote', 'action', 'measurement', 'interpretation', 'author_framework'];
const primary = {quote: ['firsthand', 'primary_record'], action: ['firsthand', 'primary_record'], measurement: ['measurement']};

export async function sha256(bytes) {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), x => x.toString(16).padStart(2, '0')).join('');
}

export function canonical(value) {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object') {
    return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}';
  }
  return JSON.stringify(value);
}

function findSpan(source, ref, statement) {
  const { startByte: start, endByte: end } = ref;
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || end <= start || end > source.bytes.length) return false;
  try {
    const excerpt = utf8.decode(source.bytes.subarray(start, end));
    return Boolean(excerpt.trim()) && (statement.kind !== 'quote' || ref.relation !== 'supports' || excerpt === statement.text);
  } catch {
    return false;
  }
}

export async function buildMind({ identity, sources, statements, links = [] }) {
  if (!idPattern.test(identity?.id ?? '') || !identity.name || !identity.domain || !identity.scale) {
    throw new TypeError('Invalid MIND identity');
  }
  const sourceMap = new Map();
  for (const source of sources) {
    if (!idPattern.test(source.id) || sourceMap.has(source.id) || typeof source.citation !== 'string' || !source.citation) {
      throw new TypeError('Invalid or duplicate source');
    }
    if (!(source.bytes instanceof Uint8Array) || !shaPattern.test(source.sha256) || await sha256(source.bytes) !== source.sha256) {
      throw new Error('Source checksum mismatch: ' + source.id);
    }
    sourceMap.set(source.id, source);
  }

  const ledger = [];
  const statementIds = new Set();
  for (const statement of statements) {
    const { id, axis, kind, text: wording } = statement;
    if (!idPattern.test(id) || statementIds.has(id) || !axes.includes(axis) || !kinds.includes(kind) || typeof wording !== 'string' || !wording.trim()) {
      throw new TypeError('Invalid or duplicate statement');
    }
    statementIds.add(id);
    if (statement.body !== undefined && !bodies.includes(statement.body)) throw new TypeError('Invalid body');
    if (statement.plane !== undefined && !planes.includes(statement.plane)) throw new TypeError('Invalid plane');
    if (kind === 'measurement' && (!Number.isFinite(statement.value) || !statement.unit?.trim?.() || !statement.method?.trim?.())) {
      throw new TypeError('Measurements require a finite value, unit and method');
    }
    const evidence = [];
    for (const ref of statement.evidence ?? []) {
      const source = sourceMap.get(ref.sourceId);
      if (!source || !['supports', 'contradicts', 'misattributed', 'context'].includes(ref.relation) ||
          typeof ref.review?.reviewer !== 'string' || !ref.review.reviewer.trim() ||
          typeof ref.review.note !== 'string' || !ref.review.note.trim() || !findSpan(source, ref, statement)) {
        throw new Error('Invalid evidence for ' + id);
      }
      evidence.push({ ...ref, sha256: source.sha256, citation: source.citation });
    }
    const usable = (ref, classes) => {
      const source = sourceMap.get(ref.sourceId);
      return ref.relation === 'supports' && classes.includes(source.classification) &&
        source.subjectId === identity.id;
    };
    const conflict = evidence.some(ref => ref.relation === 'contradicts');
    const misattributed = evidence.some(ref => ref.relation === 'misattributed');
    let status = 'unknown';
    if (misattributed) status = 'misattributed';
    else if (conflict) status = 'disputed';
    else if (kind === 'interpretation' && evidence.length) status = 'interpretation';
    else if (kind === 'author_framework' && evidence.some(ref => usable(ref, ['author_framework']))) status = 'authored';
    else if (primary[kind] && evidence.some(ref => usable(ref, primary[kind]))) status = 'source_supported';
    ledger.push({ ...statement, evidence, status });
  }
  const by = (keys, field) => Object.fromEntries(keys.map(key => [key, ledger.filter(row => row[field] === key).map(row => row.id)]));
  const active = ledger.filter(row => ['source_supported', 'authored', 'interpretation'].includes(row.status));
  const profile = {
    schema: 'nathan-ai.sovereign-mind.v1', identity, axes: by(axes, 'axis'), bodies: by(bodies, 'body'),
    planes: by(planes, 'plane'), links, activeStatementIds: active.map(row => row.id), ledger
  };
  return { ...profile, digest: await sha256(text.encode(canonical(profile))) };
}

export function renderMind(mind) {
  const lines = ['# ' + mind.identity.name + ' MIND', '', 'Identity: ' + mind.identity.id, 'Digest: ' + mind.digest];
  for (const axis of axes) {
    lines.push('', '## ' + axis);
    const rows = mind.ledger.filter(row => row.axis === axis);
    if (!rows.length) lines.push('Unknown.');
    for (const row of rows) {
      lines.push('- [' + row.status + '] ' + row.text);
      for (const ref of row.evidence) lines.push('  - ' + ref.relation + ': ' + ref.citation + ' · bytes ' + ref.startByte + '–' + ref.endByte + ' · SHA-256 ' + ref.sha256);
    }
  }
  return lines.join('\n') + '\n';
}
