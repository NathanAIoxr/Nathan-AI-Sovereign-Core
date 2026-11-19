const toolKey = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const pathPart = /^[A-Za-z0-9_][A-Za-z0-9_.-]*$/;
const githubRepository = /^[a-z0-9](?:[a-z0-9-]{0,38})\/[a-z0-9_][a-z0-9_.-]{0,99}$/i;
const validPath = value => cleanText(value, 400) && value.split('/').every(part => pathPart.test(part));
const commit = /^[a-f0-9]{40}$/;
const kinds = new Set(['worker', 'app', 'guide', 'library']);
const cleanText = (text, max) => typeof text === 'string' && text.trim() === text
  && text.length > 0 && text.length <= max && !/[\x00-\x1f\x7f]/.test(text);

export function catalogRow(row) {
  const upstream = row?.source_repository !== undefined;
  if (!row || !cleanText(row.key, 120) || !toolKey.test(row.key)
    || !cleanText(row.title, 150) || !cleanText(row.description, 360)
    || !kinds.has(row.kind) || !Array.isArray(row.tags) || row.tags.length > 12
    || !row.tags.every(tag => cleanText(tag, 36))
    || (!validPath(row.source_path) && !(upstream && row.source_path === ''))
    || row.key.startsWith('upstream-') !== upstream
    || (upstream && (!cleanText(row.source_repository, 140) || !githubRepository.test(row.source_repository)
      || !cleanText(row.source_license, 120) || !validPath(row.source_license_path)))
    || (!upstream && (row.source_license !== undefined || row.source_license_path !== undefined))
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
    source_ref: row.source_ref,
    ...(upstream ? {
      source_repository: row.source_repository,
      source_license: row.source_license,
      source_license_path: row.source_license_path
    } : {})
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
  const statements = [
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
  const upstream = [...unique.values()].filter(item => item.source_repository);
  if (upstream.length) {
    statements.push({
      sql: `INSERT INTO cloud_slayer_tool_upstream (tool_key, repository, license, license_path)
        SELECT json_extract(value, '$.key'), json_extract(value, '$.source_repository'),
          json_extract(value, '$.source_license'), json_extract(value, '$.source_license_path')
        FROM json_each(?) WHERE true
        ON CONFLICT(tool_key) DO UPDATE SET repository = excluded.repository, license = excluded.license,
          license_path = excluded.license_path`,
      params: [JSON.stringify(upstream)]
    });
  }
  return statements;
}
