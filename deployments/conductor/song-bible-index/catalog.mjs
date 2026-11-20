import { readFileSync } from 'node:fs';

export const catalog = JSON.parse(readFileSync(new URL('seed.json', import.meta.url)));
const schema = readFileSync(new URL('schema.sql', import.meta.url), 'utf8');

const tableColumns = {
  sources: ['id', 'name', 'url'],
  recordings: ['id', 'title', 'artist', 'year', 'year_kind', 'version', 'genre', 'theme', 'note'],
  recording_sources: ['recording_id', 'source_id', 'role'],
  passages: ['id', 'reference', 'source_id'],
  comparisons: ['recording_id', 'passage_id', 'relationship', 'evidence_source_id', 'rationale'],
};

function insertRows(table, rows, keys) {
  const columns = tableColumns[table];
  const placeholders = columns.map(() => '?').join(', ');
  const update = columns.filter(column => !keys.includes(column))
    .map(column => column + ' = excluded.' + column);
  const resolve = update.length ? 'DO UPDATE SET ' + update.join(', ') : 'DO NOTHING';
  return rows.map(params => {
    if (params.length !== columns.length) throw new Error('Invalid ' + table + ' row width');
    return {
      sql: 'INSERT INTO ' + table + ' (' + columns.join(', ') + ') VALUES (' + placeholders +
        ') ON CONFLICT (' + keys.join(', ') + ') ' + resolve,
      params,
    };
  });
}

export function statements() {
  const fromSchema = schema.split(';').map(sql => sql.trim()).filter(Boolean).map(sql => ({sql, params: []}));
  return [
    ...fromSchema,
    ...insertRows('sources', catalog.sources, ['id']),
    ...insertRows('recordings', catalog.recordings, ['id']),
    ...insertRows('recording_sources', catalog.recording_sources, ['recording_id', 'source_id', 'role']),
    ...insertRows('passages', catalog.passages, ['id']),
    ...insertRows('comparisons', catalog.comparisons, ['recording_id', 'passage_id']),
  ];
}

export const countsQuery = `SELECT
  (SELECT COUNT(*) FROM recordings) AS recordings,
  (SELECT COUNT(*) FROM passages) AS passages,
  (SELECT COUNT(*) FROM comparisons) AS comparisons,
  (SELECT COUNT(*) FROM sources) AS sources`;

export const databaseId = 'a7849eec-c580-4c0c-a5af-1a353ed85880';
