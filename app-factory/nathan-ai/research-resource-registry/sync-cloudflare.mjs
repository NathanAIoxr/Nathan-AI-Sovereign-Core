const cloudflareSources = [
  { kind: 'worker', path: '/workers/scripts', id: 'id', name: 'id' },
  { kind: 'pages_project', path: '/pages/projects', id: 'id', name: 'name', pageSize: 10 },
  { kind: 'd1_database', path: '/d1/database', id: 'uuid', name: 'name', pageSize: 100 },
  { kind: 'kv_namespace', path: '/storage/kv/namespaces', id: 'id', name: 'title', pageSize: 100 },
  { kind: 'r2_bucket', path: '/r2/buckets', id: 'name', name: 'name', cursor: true }
];

async function listAssets(request, accountPath, source) {
  const assets = new Map();
  const seenCursors = new Set();
  let page = 1;
  let cursor;

  for (;;) {
    const query = source.cursor ? { per_page: 100, cursor } : {};
    if (source.pageSize) Object.assign(query, { page, per_page: source.pageSize });
    const response = await request({ method: 'GET', path: accountPath + source.path, query });
    const items = source.cursor ? response.result?.buckets : response.result;
    if (!Array.isArray(items)) throw new Error('Unexpected asset list');
    for (const item of items) {
      const id = item[source.id];
      const name = item[source.name];
      if (typeof id !== 'string' || !id || typeof name !== 'string' || !name) {
        throw new Error('Provider asset is missing its ID or name');
      }
      assets.set(id, { id, name });
    }

    const pagination = response.result_info ?? {};
    if (source.cursor) {
      cursor = pagination.cursor ?? response.result?.cursor;
      if (!cursor) {
        if (pagination.is_truncated || response.result?.is_truncated) {
          throw new Error('Provider indicated more buckets without a cursor');
        }
        break;
      }
      if (seenCursors.has(cursor)) throw new Error('Repeated pagination cursor');
      seenCursors.add(cursor);
      continue;
    }
    if (!source.pageSize) break;
    const totalPages = pagination.total_pages;
    const totalCount = pagination.total_count;
    if (Number.isInteger(totalPages) && page >= totalPages) break;
    if (!Number.isInteger(totalPages) && Number.isInteger(totalCount) && page * source.pageSize >= totalCount) break;
    if (!Number.isInteger(totalPages) && !Number.isInteger(totalCount) && items.length < source.pageSize) break;
    if (!items.length) throw new Error('Unexpected empty page');
    page += 1;
  }
  return [...assets.values()];
}

async function storeSnapshot(request, queryPath, kind, assets, observedAt) {
  const source = 'cloudflare:' + kind;
  const current = "NOT EXISTS (SELECT 1 FROM inventory_snapshots WHERE source = ? AND observed_at >= ?)";
  const batch = [{
    sql: "DELETE FROM account_assets WHERE source = ? AND " + current,
    params: [source, source, observedAt]
  }];

  for (let start = 0; start < assets.length; start += 75) {
    batch.push({
      sql: "INSERT INTO account_assets (source, external_id, kind, display_name, observed_at) " +
        "SELECT ?, json_extract(value, '$.id'), ?, json_extract(value, '$.name'), ? FROM json_each(?) WHERE " + current,
      params: [source, kind, observedAt, JSON.stringify(assets.slice(start, start + 75)), source, observedAt]
    });
  }

  batch.push({
    sql: "INSERT INTO inventory_snapshots (source, inventory_count, observed_at) VALUES (?, ?, ?) " +
      "ON CONFLICT(source) DO UPDATE SET inventory_count = excluded.inventory_count, observed_at = excluded.observed_at " +
      "WHERE excluded.observed_at > inventory_snapshots.observed_at",
    params: [source, String(assets.length), observedAt]
  });

  const response = await request({ method: 'POST', path: queryPath, body: { batch } });
  if (!Array.isArray(response.result) || response.result.length !== batch.length ||
      response.result.some(result => !result.success)) {
    throw new Error('D1 did not confirm every snapshot statement');
  }
  return { kind, count: assets.length, updated: response.result.at(-1).meta?.changes === 1 };
}

export async function syncCloudflareInventory(request, accountId, databaseId) {
  const accountPath = '/accounts/' + encodeURIComponent(accountId);
  const queryPath = accountPath + '/d1/database/' + encodeURIComponent(databaseId) + '/query';
  const observedAt = new Date().toISOString();
  const inventories = await Promise.allSettled(cloudflareSources.map(source =>
    listAssets(request, accountPath, source)
  ));
  const report = [];

  // Apply each successful snapshot in one transaction. A failed source keeps its previous snapshot.
  for (const [index, source] of cloudflareSources.entries()) {
    const result = inventories[index];
    if (result.status === 'rejected') {
      report.push({ kind: source.kind, error: String(result.reason) });
      continue;
    }
    try {
      report.push(await storeSnapshot(request, queryPath, source.kind, result.value, observedAt));
    } catch (error) {
      report.push({ kind: source.kind, error: String(error) });
    }
  }
  return report;
}
