const toolKey = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const pathPart = /^[A-Za-z0-9_][A-Za-z0-9_.-]*$/;
const commit = /^[a-f0-9]{40}$/;
const kinds = new Set(['worker', 'app', 'guide', 'library']);
const cleanText = (text, max) => typeof text === 'string' && text.trim() === text
  && text.length > 0 && text.length <= max && !/[\x00-\x1f\x7f]/.test(text);

export function catalogRow(row) {
  if (!row || !cleanText(row.key, 120) || !toolKey.test(row.key)
    || !cleanText(row.title, 150) || !cleanText(row.description, 360)
    || !kinds.has(row.kind) || !Array.isArray(row.tags) || row.tags.length > 12
    || !row.tags.every(tag => cleanText(tag, 36))
    || !cleanText(row.source_path, 400) || !row.source_path.split('/').every(part => pathPart.test(part))
    || typeof row.source_ref !== 'string' || !commit.test(row.source_ref)) {
    throw new Error('Invalid tool catalog record.');
  }
  return {
    key: row.key,
    title: row.title,
    description: row.description,
    tags: [...new Set(row.tags)].join(', '),
    kind: row.kind,
    source_path: row.source_path,
    source_ref: row.source_ref
  };
}

export const catalogBatchSize = 100;

export function catalogBatch(input) {
  const unique = new Map(input.map(item => {
    const clean = catalogRow(item);
    return [clean.key, clean];
  }));
  if (!unique.size) return [];
  const payload = JSON.stringify([...unique.values()]);
  const selected = `SELECT t.id FROM cloud_slayer_tools t
    JOIN json_each(?) j ON t.tool_key = json_extract(j.value, '$.key')`;
  return [
    {
      sql: `UPDATE cloud_slayer_tool_count SET total = total + (
        SELECT count(*) FROM json_each(?) j
        WHERE NOT EXISTS (SELECT 1 FROM cloud_slayer_tools t WHERE t.tool_key = json_extract(j.value, '$.key'))
      ) WHERE singleton = 1`,
      params: [payload]
    },
    { sql: `DELETE FROM cloud_slayer_tool_search WHERE rowid IN (${selected})`, params: [payload] },
    {
      sql: `INSERT INTO cloud_slayer_tools (tool_key, title, description, tags, kind, source_path, source_ref)
        SELECT json_extract(value, '$.key'), json_extract(value, '$.title'), json_extract(value, '$.description'),
          json_extract(value, '$.tags'), json_extract(value, '$.kind'), json_extract(value, '$.source_path'),
          json_extract(value, '$.source_ref') FROM json_each(?) WHERE true
        ON CONFLICT(tool_key) DO UPDATE SET title = excluded.title, description = excluded.description,
          tags = excluded.tags, kind = excluded.kind, source_path = excluded.source_path, source_ref = excluded.source_ref`,
      params: [payload]
    },
    {
      sql: `INSERT INTO cloud_slayer_tool_search (rowid, tool_key, title, description, tags)
        SELECT id, tool_key, title, description, tags FROM cloud_slayer_tools WHERE id IN (${selected})`,
      params: [payload]
    }
  ];
}
