export const VAULT = '2744aea4-b218-41e9-ab21-a04f25c10475';
export const BUILD_LEDGER = 'f6d6879c-3b15-4ca0-93d4-1da1860b3b55';
export const REPOSITORY = 'NathanAIoxr/Nathan-AI-Sovereign-Core';

export function validManifest(path) {
  return /^(app-factory|standalone-apps|integrations\/pocket-control-plane\/codex-release\/projects)\/(?:[\w.-]+\/)*app\.json$/.test(path)
    && path.split('/').every((part) => part !== '..' && part !== '.');
}

export function githubCandidates(rows, verified, commit) {
  if (!/^[a-f0-9]{40}$/.test(commit)) throw Error('Expected a pinned GitHub commit');
  const proposals = [];
  for (const row of rows) {
    if (!validManifest(row.source_ref)) continue;
    const blob = verified.get(row.source_ref);
    if (!/^[a-f0-9]{40}$/.test(blob ?? '')) continue;
    proposals.push({workspace_id:row.workspace_id,candidate_key:'manifest:'+row.source_ref,
      action:'Review this tracked manifest for the project’s staged build',
      source_ref:'https://github.com/'+REPOSITORY+'/blob/'+commit+'/'+row.source_ref.split('/').map(encodeURIComponent).join('/'),
      evidence:{path:row.source_ref,commit,blob,recorded_source_commit:row.pinned ?? null,verification:'Manifest exists at the recorded Git path and parses as a JSON object'}});
  }
  return proposals;
}

export async function readAll(query, db, statement) {
  const rows = [];
  for (let offset=0;;offset+=150) {
    const page = (await query(db,statement+' LIMIT 150 OFFSET ?',[offset])).results;
    rows.push(...page);
    if (page.length<150) return rows;
  }
}

export const manifestRows = (query) => readAll(query,VAULT,`SELECT c.workspace_id,c.source_ref,json_extract(c.snapshot_json,'$.source_commit') pinned
FROM zone_components c JOIN zones_registry z USING(workspace_id)
WHERE c.source_table='release_fleet_sources_v1' AND z.launch_status='HOLDING'
ORDER BY c.workspace_id,c.source_id`);

export async function cloudflareCandidates(query) {
  const [mirrors,releases,features] = await Promise.all([
    readAll(query,VAULT,`SELECT c.workspace_id,c.source_table,c.source_id,c.source_ref
      FROM zone_components c JOIN zones_registry z USING(workspace_id)
      WHERE z.launch_status='HOLDING' AND c.source_table IN ('release_fleet_jobs_v1','sovereign_app_unit_feature_v1')
      ORDER BY c.workspace_id,c.source_table,c.source_id`),
    readAll(query,BUILD_LEDGER,`SELECT target||':'||project_key AS id,target,status,stage,source_path,json_array_length(receipts) receipts
      FROM release_fleet_jobs_v1 WHERE target='website' ORDER BY project_key`),
    readAll(query,BUILD_LEDGER,`SELECT unit_id AS id,state,receipt_json IS NOT NULL AS has_receipt
      FROM sovereign_app_unit_feature_v1 ORDER BY unit_id`)
  ]);
  const releaseMap=new Map(releases.map((row)=>[row.id,row]));
  const featureMap=new Map(features.map((row)=>[row.id,row]));
  const candidates=[];
  for (const mirror of mirrors) {
    const isFeature=mirror.source_table==='sovereign_app_unit_feature_v1';
    const row=(isFeature ? featureMap : releaseMap).get(mirror.source_id);
    if (!row) continue;
    if (isFeature ? !(row.state==='verified' && row.has_receipt) : !(row.status==='verified' && row.stage==='production' && row.receipts>0)) continue;
    candidates.push({workspace_id:mirror.workspace_id,candidate_key:mirror.source_table+':'+row.id,
      action:isFeature ? 'Review the verified build feature for reuse in this stage' : 'Review the existing production release for this project’s private stage',
      source_ref:'D1 tabor-autonomous-builds / '+mirror.source_table+' / '+row.id,
      evidence:{table:mirror.source_table,row_id:row.id,status:row.status ?? row.state,stage:row.stage ?? 'feature',receipts:row.receipts ?? Number(row.has_receipt),source_path:row.source_path ?? mirror.source_ref ?? null}});
  }
  return {rowsRead:mirrors.length+releases.length+features.length,candidates};
}

export async function persist(query, reader, runId, source, rowsRead, candidates) {
  if (!['github','cloudflare'].includes(reader)) throw Error('Unknown reader');
  const insert=`INSERT INTO zone_reader_candidates(reader,workspace_id,candidate_key,action,source_ref,evidence_json)
    SELECT ?2,json_extract(value,'$.workspace_id'),json_extract(value,'$.candidate_key'),
      json_extract(value,'$.action'),json_extract(value,'$.source_ref'),json_extract(value,'$.evidence')
    FROM json_each(?1) WHERE 1
    ON CONFLICT(reader,workspace_id,candidate_key) DO UPDATE SET
      action=excluded.action,source_ref=excluded.source_ref,evidence_json=excluded.evidence_json,observed_at=CURRENT_TIMESTAMP
    WHERE zone_reader_candidates.evidence_json<>excluded.evidence_json OR zone_reader_candidates.action<>excluded.action
      OR zone_reader_candidates.source_ref<>excluded.source_ref`;
  let changed=0;
  for(let offset=0;offset<candidates.length;offset+=60) {
    const result=await query(VAULT,insert,[JSON.stringify(candidates.slice(offset,offset+60)),reader]);
    changed+=result.meta.changes;
  }
  await query(VAULT,`INSERT INTO zone_reader_runs(run_id,reader,source_ref,rows_read,candidates) VALUES(?,?,?,?,?)
    ON CONFLICT(reader,run_id) DO NOTHING`,[runId,reader,source,rowsRead,candidates.length]);
  return {reader,rowsRead,candidates:candidates.length,changed};
}
