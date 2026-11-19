const BUILD_DB = 'f6d6879c-3b15-4ca0-93d4-1da1860b3b55';
const VAULT_DB = '2744aea4-b218-41e9-ab21-a04f25c10475';

async function sha256(text) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2,'0')).join('');
}

export async function replicateInventory(request, account) {
  const root = '/accounts/' + account;
  const sql = async (db, statement, params = []) => {
    const response = await request({method:'POST', path:root+'/d1/database/'+db+'/query', body:{sql:statement,params}});
    if (!response.result?.[0]?.success) throw Error('D1 query did not succeed');
    return response.result[0];
  };
  async function read(db, statement) {
    const rows = [];
    for (let offset = 0;;offset += 48) {
      const page = (await sql(db, statement+' LIMIT 48 OFFSET ?', [offset])).results;
      rows.push(...page);
      if (page.length < 48) return rows;
    }
  }

  const [units, features, releases, manifests, mobile, stations, audits, registry] = await Promise.all([
    read(BUILD_DB,"SELECT id,title,kind,evidence_stage,source_json,source_sha256,workstream,next_action,repository_path,package_state,package_json,package_sha256,packaged_at,package_error FROM sovereign_app_unit_v1 ORDER BY id"),
    read(BUILD_DB,"SELECT unit_id,state,updated_at,receipt_json FROM sovereign_app_unit_feature_v1 ORDER BY unit_id"),
    read(BUILD_DB,"SELECT project_key,target,source_path,stage,status,next_action,receipts,updated_at FROM release_fleet_jobs_v1 ORDER BY project_key,target"),
    read(BUILD_DB,"SELECT manifest_path,kind,source_commit,updated_at FROM release_fleet_sources_v1 ORDER BY manifest_path"),
    read(BUILD_DB,"SELECT app_key,platform,source_ref,priority,stage,status,next_action,receipt_history_json,updated_at FROM app_store_release_jobs_v1 ORDER BY app_key,platform"),
    read(BUILD_DB,"SELECT app_id,task,status,receipt,updated_at FROM game_station_jobs_v1 ORDER BY app_id"),
    read(BUILD_DB,"SELECT app_id,audit_commit,source_state,candidates_json,draft_plan_id,draft_task_key,checked_at FROM game_station_source_audit_v1 ORDER BY app_id"),
    read(VAULT_DB,"SELECT workspace_id,source_key,launch_status FROM zones_registry ORDER BY workspace_id")
  ]);
  const pages = [];
  for (let page = 1; ;page++) {
    const x = await request({method:'GET',path:root+'/pages/projects',query:{page,per_page:10}});
    pages.push(...x.result);
    if (x.result.length < 10 || page >= x.result_info?.total_pages) break;
  }
  const existing = new Map(registry.map((row) => [row.source_key,row]));
  const newRows = new Map();
  const components = [];
  const knownPaths = new Map();
  const targets = new Map();
  const namespace = 'NathanAIoxr/Nathan-AI-Sovereign-Core';

  async function zone(key,title,kind,legacyId) {
    const known = existing.get(key) ?? newRows.get(key);
    if (known) return known.workspace_id;
    const id = legacyId ?? 'project-'+(await sha256(key)).slice(0,24);
    newRows.set(key,{workspace_id:id,source_key:key,project_name:title,project_kind:kind,launch_status:'HOLDING'});
    return id;
  }
  function link(path,id) {
    if (!path) return;
    if (!knownPaths.has(path)) knownPaths.set(path,new Set());
    knownPaths.get(path).add(id);
  }
  function byPath(path) {
    const ids = knownPaths.get(path);
    return ids?.size === 1 ? ids.values().next().value : null;
  }
  function add(workspace_id,component_type,source_table,source_id,data,source_ref=null) {
    components.push({workspace_id,component_type,source_table,source_id,source_ref,snapshot_json:JSON.stringify(data)});
  }

  const unitZones = new Map();
  for (const row of units) {
    const id = await zone('sovereign_app_unit_v1:'+row.id,row.title,row.kind,'unit-'+row.id);
    unitZones.set(row.id,id);
    link(row.repository_path,id);
    const {package_json,package_sha256,packaged_at,package_error,...source} = row;
    add(id,'project source','sovereign_app_unit_v1',row.id,source,row.repository_path);
    if (package_json) add(id,'build package','sovereign_app_unit_package_v1',row.id,{package_json,package_sha256,packaged_at},row.repository_path);
    else if (package_error) add(id,'package status','sovereign_app_unit_package_v1',row.id,{package_error},row.repository_path);
  }
  for (const row of features) {
    const id = unitZones.get(row.unit_id);
    if (id) add(id,'build feature','sovereign_app_unit_feature_v1',row.unit_id,row);
  }

  const pageZones = new Map();
  for (const p of pages) {
    const id = await zone('cloudflare-pages:'+p.id,p.name,'Cloudflare Pages project','pages-'+p.name);
    pageZones.set(p.name,id);
    const d = p.canonical_deployment;
    add(id,'Pages configuration','cloudflare_pages_project',p.id,{name:p.name,id:p.id,production_branch:p.production_branch,source_type:p.source?.type??null});
    if (d?.id) add(id,'existing production reference','cloudflare_pages_deployment',d.id,{id:d.id,created_on:d.created_on,stage:d.latest_stage?.status,environment:d.environment},d.url);
  }

  const releasePathUses = new Map();
  for (const row of releases) releasePathUses.set(row.source_path,(releasePathUses.get(row.source_path) ?? 0)+1);
  for (const row of releases) {
    const key = row.target+':'+row.project_key;
    const bookKey = 'release_fleet_jobs_v1:'+row.project_key;
    const id = row.target === 'book'
      ? await zone(bookKey,row.source_path.split('/').at(-1),'Book','book-'+(await sha256(row.project_key)).slice(0,20))
      : (row.target === 'website' ? pageZones.get(row.project_key) : null)
        ?? (releasePathUses.get(row.source_path) === 1 && row.source_path.endsWith('/app.json') ? byPath(row.source_path) : null)
        ?? await zone('release_fleet_jobs_v1:'+key,row.project_key,row.target);
    targets.set(key,id);
    link(row.source_path,id);
    add(id,'release record','release_fleet_jobs_v1',key,row,row.source_path);
  }
  for (const row of manifests) {
    const id = byPath(row.manifest_path)
      ?? await zone('release_fleet_sources_v1:'+row.manifest_path,row.manifest_path.split('/').slice(-2,-1)[0],row.kind);
    link(row.manifest_path,id);
    add(id,'GitHub manifest reference','release_fleet_sources_v1',row.manifest_path,{...row,repository:namespace},row.manifest_path);
  }

  const mobileZones = new Map();
  for (const row of mobile) {
    let id = mobileZones.get(row.app_key);
    if (!id) {
      id = byPath(row.source_ref) ?? byPath(row.source_ref.replace(/\/$/,'')+'/app.json')
        ?? await zone('native-app:'+row.app_key,row.app_key,'Native app');
      mobileZones.set(row.app_key,id);
    }
    add(id,row.platform+' build','app_store_release_jobs_v1',row.app_key+':'+row.platform,row,row.source_ref);
  }

  const stationZones = new Map();
  for (const row of stations) {
    const path = 'standalone-apps/game-app-stations/apps/'+row.app_id+'/app.json';
    const id = byPath(path) ?? targets.get('website:'+row.app_id) ?? await zone('game-station:'+row.app_id,row.app_id,'Game station');
    stationZones.set(row.app_id,id);
    add(id,'game station','game_station_jobs_v1',row.app_id,row,path);
  }
  for (const row of audits) {
    const id = stationZones.get(row.app_id);
    if (id) add(id,'source audit','game_station_source_audit_v1',row.app_id,row);
  }

  const registryInsert = `INSERT INTO zones_registry(workspace_id,project_name,project_kind,source_key)
    SELECT json_extract(value,'$.workspace_id'),json_extract(value,'$.project_name'),json_extract(value,'$.project_kind'),json_extract(value,'$.source_key')
    FROM json_each(?) WHERE true ON CONFLICT(workspace_id) DO NOTHING`;
  const componentInsert = `INSERT INTO zone_components(workspace_id,component_type,source_table,source_id,source_ref,snapshot_json,snapshot_sha256)
    SELECT json_extract(value,'$.workspace_id'),json_extract(value,'$.component_type'),json_extract(value,'$.source_table'),
      json_extract(value,'$.source_id'),json_extract(value,'$.source_ref'),json_extract(value,'$.snapshot_json'),json_extract(value,'$.snapshot_sha256')
    FROM json_each(?) WHERE true ON CONFLICT(workspace_id,source_table,source_id) DO UPDATE SET
      component_type=excluded.component_type,source_ref=excluded.source_ref,snapshot_json=excluded.snapshot_json,
      snapshot_sha256=excluded.snapshot_sha256,captured_at=CURRENT_TIMESTAMP
    WHERE zone_components.snapshot_sha256<>excluded.snapshot_sha256
      OR zone_components.source_ref IS NOT excluded.source_ref
      OR zone_components.component_type<>excluded.component_type`;

  async function write(statement, rows) {
    let batch = [], size = 0, changed = 0;
    const encoder = new TextEncoder();
    async function flush() {
      if (!batch.length) return;
      changed += (await sql(VAULT_DB,statement,[JSON.stringify(batch)])).meta.changes;
      batch = [];
      size = 0;
    }
    for (const row of rows) {
      const bytes = encoder.encode(JSON.stringify(row)).byteLength;
      if (batch.length >= 90 || size + bytes > 90000) await flush();
      batch.push(row);
      size += bytes;
    }
    await flush();
    return changed;
  }
  const writtenZones = await write(registryInsert,[...newRows.values()]);
  for (const row of components) row.snapshot_sha256 = await sha256(row.snapshot_json);
  const writtenComponents = await write(componentInsert,components);
  const verification = (await sql(VAULT_DB,`SELECT
    (SELECT count(*) FROM zones_registry) AS zones,
    (SELECT count(*) FROM zones_registry WHERE launch_status='LIVE') AS live_zones,
    (SELECT count(*) FROM zones_registry WHERE domain_status<>'unassigned') AS mapped_domains,
    (SELECT count(*) FROM zone_components) AS components,
    (SELECT count(*) FROM zones_registry z WHERE NOT EXISTS(SELECT 1 FROM zone_components c WHERE c.workspace_id=z.workspace_id)) AS empty_zones,
    (SELECT count(*) FROM zone_components c LEFT JOIN zones_registry z ON z.workspace_id=c.workspace_id WHERE z.workspace_id IS NULL) AS orphan_components`)).results[0];
  const breakdown = (await sql(VAULT_DB,'SELECT source_table,count(*) AS records FROM zone_components GROUP BY source_table ORDER BY source_table')).results;
  return {writtenZones,writtenComponents,verification,breakdown};
}
