export function inventoryBatch(ids, recordedAt) {
  if (!Array.isArray(ids) || !ids.length || !ids.every(id => typeof id === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(id))) {
    throw new Error('Expected a nonempty list of Cloudflare Worker identifiers.');
  }
  if (!Number.isFinite(Date.parse(recordedAt))) throw new Error('Expected a snapshot timestamp.');
  const unique = [...new Set(ids)];
  const entries = [];
  for (let i = 0; i < unique.length; i += 500) {
    entries.push({
      sql: 'INSERT INTO cloud_worker_inventory (worker_id, recorded_at) SELECT value, ? FROM json_each(?)',
      params: [recordedAt, JSON.stringify(unique.slice(i, i + 500))]
    });
  }
  return [
    { sql: 'DELETE FROM cloud_worker_inventory' },
    ...entries,
    {
      sql: "INSERT INTO cloud_slayer_snapshot VALUES ('cloudflare-workers', ?) ON CONFLICT(source) DO UPDATE SET recorded_at=excluded.recorded_at",
      params: [recordedAt]
    }
  ];
}
