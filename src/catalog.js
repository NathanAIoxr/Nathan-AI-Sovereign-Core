// Source-aware, resumable D1 catalog import. No external packages.
export const SOURCES = [
  { binding: "GLOBAL_DB", name: "tabor-global-import-catalog" },
  { binding: "FLEET_DB", name: "tabor-fleet-registry" },
  { binding: "MASTER_DB", name: "nathan-ai-global-catalog" }
];
const PAGE_SIZE = 100;
const quote = (name) => '"' + String(name).replaceAll('"', '""') + '"';
const pick = (record, keys) => {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && String(value) !== "") return String(value);
  }
  return null;
};

async function tablesFor(env) {
  const list = [];
  const errors = [];
  for (const source of SOURCES) {
    const db = env[source.binding];
    if (!db) {
      errors.push(source.binding + ": missing binding");
      continue;
    }
    try {
      const found = await db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY name"
      ).all();
      for (const row of found.results || []) {
        list.push({ ...source, db, table: String(row.name) });
      }
    } catch (error) {
      errors.push(source.binding + ": " + String(error.message || error));
    }
  }
  return { list, errors };
}

export async function sourceInventory(env) {
  const { list, errors } = await tablesFor(env);
  const result = [];
  for (const source of list) {
    try {
      const row = await source.db.prepare("SELECT COUNT(*) AS n FROM " + quote(source.table)).first();
      result.push({ source_db: source.name, table: source.table, rows: Number(row?.n || 0) });
    } catch (error) {
      errors.push(source.name + "/" + source.table + ": " + String(error.message || error));
    }
  }
  return { tables: result, errors, total_rows: result.reduce((n, t) => n + t.rows, 0) };
}

function recordId(row, pkColumns) {
  if (pkColumns.length && pkColumns.every(key => row[key] !== null && row[key] !== undefined)) {
    return pkColumns.map(key => String(row[key])).join("|");
  }
  return pick(row, [
    "item_id", "repo", "repo_full_name", "resource_name", "source_id",
    "policy_key", "set_id", "slot_id", "node_id", "slug", "id", "slot",
    "name", "__catalog_rowid"
  ]);
}

function normalize(row, source, pkColumns) {
  const sourceId = recordId(row, pkColumns);
  if (sourceId === null) throw new Error("No stable identifier for " + source.name + "/" + source.table);
  const name = pick(row, ["name", "title", "repo", "item_id", "resource_name", "script_name", "worker_name", "node_id", "set_id", "id"]) || sourceId;
  const candidate = pick(row, ["repo_url", "github_url", "url"]);
  const repoUrl = candidate && /^https:\/\/github\.com\/[^/\s]+\/[^/\s#?]+\/?$/i.test(candidate) ? candidate : null;
  const category = pick(row, ["category", "resource_type", "type", "layer", "compatibility"]) || source.table;
  const sourceStatus = pick(row, ["source_status", "source_state", "deployment_state", "status", "state", "stage"]) || "INVENTORIED";
  const uid = source.name + ":" + source.table + ":" + sourceId;
  return { uid, source_id: sourceId, name, category, repo_url: repoUrl, source_status: sourceStatus };
}

async function importPage(env, source, offset) {
  const details = await source.db.prepare("PRAGMA table_info(" + quote(source.table) + ")").all();
  const pkColumns = (details.results || []).filter(row => row.pk > 0).sort((a, b) => a.pk - b.pk).map(row => row.name);
  let result;
  try {
    result = await source.db.prepare(
      "SELECT rowid AS __catalog_rowid, * FROM " + quote(source.table) + " ORDER BY rowid LIMIT ? OFFSET ?"
    ).bind(PAGE_SIZE, offset).all();
  } catch (error) {
    // WITHOUT ROWID tables are ordered by their declared key.
    if (!pkColumns.length) throw error;
    result = await source.db.prepare(
      "SELECT * FROM " + quote(source.table) + " ORDER BY " + pkColumns.map(quote).join(",") + " LIMIT ? OFFSET ?"
    ).bind(PAGE_SIZE, offset).all();
  }
  const rows = result.results || [];
  const now = new Date().toISOString();
  if (rows.length) {
    const statement = env.DB.prepare(
      "INSERT INTO unified_catalog " +
      "(uid,source_db,source_table,source_id,name,category,repo_url,source_status,integration_status,synced_to_github,updated_at) " +
      "VALUES(?,?,?,?,?,?,?,?, 'INDEXED',0,?) " +
      "ON CONFLICT(uid) DO UPDATE SET name=excluded.name,category=excluded.category," +
      "repo_url=excluded.repo_url,source_status=excluded.source_status,updated_at=excluded.updated_at"
    );
    await env.DB.batch(rows.map(row => {
      const item = normalize(row, source, pkColumns);
      return statement.bind(
        item.uid, source.name, source.table, item.source_id, item.name,
        item.category, item.repo_url, item.source_status, now
      );
    }));
  }
  const nextOffset = offset + rows.length;
  const total = await source.db.prepare("SELECT COUNT(*) AS n FROM " + quote(source.table)).first();
  const completed = nextOffset >= Number(total?.n || 0);
  const key = source.name + ":" + source.table;
  await env.DB.prepare(
    "INSERT INTO import_cursors (source_key,row_offset,complete,updated_at) VALUES (?,?,?,?) " +
    "ON CONFLICT(source_key) DO UPDATE SET row_offset=excluded.row_offset,complete=excluded.complete,updated_at=excluded.updated_at"
  ).bind(key, nextOffset, completed ? 1 : 0, now).run();
  return { source: key, rows: rows.length, next_offset: nextOffset, complete: completed };
}

export async function importCatalog(env, requestedPages = 4) {
  const pageBudget = Math.max(1, Math.min(20, Number(requestedPages) || 4));
  const { list, errors } = await tablesFor(env);
  const pages = [];
  for (const source of list) {
    if (pages.length >= pageBudget) break;
    const key = source.name + ":" + source.table;
    const cursor = await env.DB.prepare("SELECT row_offset,complete FROM import_cursors WHERE source_key=?").bind(key).first();
    if (cursor?.complete === 1) continue;
    try {
      pages.push(await importPage(env, source, Number(cursor?.row_offset || 0)));
    } catch (error) {
      errors.push(key + ": " + String(error.message || error));
    }
  }
  const progress = await env.DB.prepare(
    "SELECT COUNT(*) AS done FROM import_cursors WHERE complete=1"
  ).first();
  const complete = errors.length === 0 && Number(progress?.done || 0) === list.length;
  return {
    ok: errors.length === 0, complete, sources_discovered: list.length,
    sources_completed: Number(progress?.done || 0),
    rows_processed: pages.reduce((n, page) => n + page.rows, 0),
    pages, errors
  };
}
