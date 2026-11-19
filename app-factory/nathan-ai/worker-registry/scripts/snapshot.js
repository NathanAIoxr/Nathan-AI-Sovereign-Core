export const snapshotSql = `
WITH incoming AS MATERIALIZED (
  SELECT json_extract(value, '$.key') AS record_key,
         json_extract(value, '$.title') AS title,
         json_extract(value, '$.location') AS location,
         COALESCE(json_extract(value, '$.ref'), '') AS source_ref
  FROM json_each(?)
), snapshot AS (SELECT ? AS stamp)
INSERT INTO owned_runtime_registry
  (record_key, kind, title, location, source_ref, state, provenance, updated_at)
SELECT record_key, 'worker', title, location, source_ref, 'observed', 'cloudflare-account', stamp
FROM incoming CROSS JOIN snapshot WHERE 1
UNION ALL
SELECT r.record_key, r.kind, r.title, r.location, r.source_ref, 'missing', r.provenance, stamp
FROM owned_runtime_registry r CROSS JOIN snapshot
WHERE r.provenance = 'cloudflare-account'
  AND NOT EXISTS (SELECT 1 FROM incoming i WHERE i.record_key = r.record_key)
ON CONFLICT(record_key) DO UPDATE SET title = excluded.title, location = excluded.location,
  source_ref = excluded.source_ref, state = excluded.state, updated_at = excluded.updated_at
WHERE excluded.updated_at >= owned_runtime_registry.updated_at
`;

export function inventoryRow(script, namespace) {
  const id = script.id;
  if (typeof id !== 'string' || !/^[a-z0-9_-]{1,128}$/.test(id)
      || typeof namespace !== 'string' || !/^[a-z0-9_-]{1,55}$/.test(namespace)) {
    throw new Error('An owned script identifier is outside the registry format.');
  }
  return {
    key: 'worker:' + namespace + ':' + id,
    title: id,
    location: namespace === 'account' ? 'Cloudflare account Worker' : namespace,
    ref: typeof script.deployment_id === 'string' ? script.deployment_id.slice(0, 120) : ''
  };
}
