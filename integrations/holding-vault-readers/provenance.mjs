import {REPOSITORY} from './readers.mjs';

const statuses = new Set(['directory','gitlink','symlink','binary','large-blob','references-found','no-static-reference']);
const allowedPath = (value,empty=false) => typeof value==='string' && value.length<=1024 &&
  ((empty && value==='') || (value.length>0 && !/[\u0000-\u001f\\]/.test(value) &&
  value.split('/').every(part=>part && part!=='.' && part!=='..')));
const sha = (value,size) => typeof value==='string' && value.length===size && /^[a-f0-9]+$/.test(value);
const validNode = row => Array.isArray(row) && row.length===6 && allowedPath(row[0]) && statuses.has(row[1]) &&
  sha(row[2],40) && (row[3]===null || sha(row[3],64)) && (row[4]===null || (Number.isSafeInteger(row[4]) && row[4]>=0)) &&
  allowedPath(row[5],true) && row[5]===row[0].split('/').slice(0,-1).join('/');
const validEdge = row => Array.isArray(row) && row.length===2 && row.every(path=>allowedPath(path));

const nodeWrite = `INSERT INTO zone_reader_provenance_nodes SELECT 'github:path:'||?2||':'||json_extract(value,'$[0]'),
  CASE json_extract(value,'$[1]') WHEN 'directory' THEN 'GitHub directory' WHEN 'gitlink' THEN 'GitHub gitlink' ELSE 'GitHub file' END,
  json_extract(value,'$[0]'),'indexed',json_object('commit',?2,'git_object',json_extract(value,'$[2]'),'sha256',json_extract(value,'$[3]'),
  'bytes',json_extract(value,'$[4]'),'scan_status',json_extract(value,'$[1]'),'parent',json_extract(value,'$[5]'))
  FROM json_each(?1) WHERE 1 ON CONFLICT(node_key) DO UPDATE SET details_json=excluded.details_json
  WHERE details_json<>excluded.details_json`;

const edgeWrite = `INSERT OR IGNORE INTO zone_reader_provenance_edges SELECT source.node_key,target.node_key,'embedded reference'
  FROM json_each(?1) JOIN zone_reader_provenance_nodes source ON source.node_key='github:path:'||?2||':'||json_extract(value,'$[0]')
  JOIN zone_reader_provenance_nodes target ON target.node_key='github:path:'||?2||':'||json_extract(value,'$[1]')`;

export async function graphJob(request, db, commit, reply) {
  const receipt = 'tree-'+commit;
  if (request.method==='GET') {
    const done=await db.prepare("SELECT rows_read FROM zone_reader_runs WHERE reader='github' AND run_id=?").bind(receipt).first();
    return reply({complete:!!done,entries:done?.rows_read??null});
  }
  if (Number(request.headers.get('Content-Length'))>450000) return reply({error:'Graph batch too large'},413);
  const raw=await request.text();
  if (raw.length>450000) return reply({error:'Graph batch too large'},413);
  let batch;
  try {batch=JSON.parse(raw);} catch {return reply({error:'Invalid graph batch'},400);}
  if (batch?.kind==='nodes' || batch?.kind==='edges') {
    const isNodes=batch.kind==='nodes';
    if (!Array.isArray(batch.rows) || batch.rows.length>180 || !batch.rows.every(isNodes?validNode:validEdge)) {
      return reply({error:'Invalid graph records'},400);
    }
    const result=await db.prepare(isNodes?nodeWrite:edgeWrite).bind(JSON.stringify(batch.rows),commit).run();
    return reply({received:batch.rows.length,changed:result.meta.changes});
  }
  if (batch?.kind!=='finish' || !Number.isSafeInteger(batch.entries) || batch.entries<1 ||
      !Number.isSafeInteger(batch.links) || batch.links<0) {
    return reply({error:'Invalid graph completion'},400);
  }
  const prefix='github:path:'+commit+':';
  const upper='github:path:'+commit+';';
  const row=await db.prepare(`SELECT
    (SELECT COUNT(*) FROM zone_reader_provenance_nodes WHERE node_key>=?1 AND node_key<?2
     AND json_extract(details_json,'$.scan_status') IS NOT NULL) AS n,
    (SELECT COUNT(*) FROM zone_reader_provenance_edges WHERE source_key>=?1 AND source_key<?2
     AND relation='embedded reference') AS links`).bind(prefix,upper).first();
  if (row.n!==batch.entries || row.links!==batch.links) {
    return reply({error:'Incomplete Git tree receipt',received:row.n,links:row.links},409);
  }
  const statements=[
    db.prepare("INSERT OR IGNORE INTO zone_reader_provenance_nodes VALUES(?1,'GitHub repository',?2,'indexed','{}')").bind('github:repo:'+REPOSITORY,REPOSITORY),
    db.prepare("INSERT OR IGNORE INTO zone_reader_provenance_nodes VALUES(?1,'GitHub commit',?2,'indexed',json_object('repository',?3))").bind('github:commit:'+commit,commit,REPOSITORY),
    db.prepare("INSERT OR IGNORE INTO zone_reader_provenance_nodes VALUES(?1,'GitHub tree root',?2,'indexed',json_object('commit',?3))").bind(prefix,REPOSITORY,commit),
    db.prepare("INSERT OR IGNORE INTO zone_reader_provenance_edges VALUES(?1,?2,'in repository'),(?3,?1,'verified at')")
      .bind('github:commit:'+commit,'github:repo:'+REPOSITORY,prefix),
    db.prepare(`INSERT OR IGNORE INTO zone_reader_provenance_edges SELECT n.node_key,p.node_key,'in Git tree'
      FROM zone_reader_provenance_nodes n JOIN zone_reader_provenance_nodes p ON p.node_key=?1||json_extract(n.details_json,'$.parent')
      WHERE n.node_key>=?1 AND n.node_key<?2 AND n.node_key<>p.node_key`).bind(prefix,upper),
    db.prepare(`INSERT OR IGNORE INTO zone_reader_provenance_edges
      SELECT src.node_key,p.node_key,'pinned-source'
      FROM zone_components c JOIN zone_reader_provenance_nodes p ON p.node_key=?1||rtrim(trim(c.source_ref),'/')
      JOIN zone_reader_provenance_nodes src ON src.node_key='component:'||json_array(c.workspace_id,c.source_table,c.source_id)`).bind(prefix),
    db.prepare(`INSERT OR IGNORE INTO zone_reader_runs(run_id,reader,source_ref,rows_read,candidates) VALUES(?1,'github',?2,?3,0)`)
      .bind(receipt,REPOSITORY+'@'+commit,row.n)
  ];
  await db.batch(statements);
  return reply({complete:true,entries:row.n,commit});
}
