export async function buildProvenance(query,inventory,verifiedGit,{after=0,through=Number.MAX_SAFE_INTEGER}={}){
  const vault='2744aea4-b218-41e9-ab21-a04f25c10475';
  const build='f6d6879c-3b15-4ca0-93d4-1da1860b3b55';
  const repo='NathanAIoxr/Nathan-AI-Sovereign-Core';
  const account=inventory.account;
  const nodes=new Map(), edges=new Map();
  const owned={worker:new Map(),pages:new Map()};
  const counted={components:0,embeddedReferences:0};
  function node(key,kind,locator,resolution='indexed',details={}) {
    if(!nodes.has(key)||nodes.get(key)[3]==='unresolved')nodes.set(key,[key,kind,locator,resolution,details]);
    return key;
  }
  function edge(from,to,relation) {
    const key=JSON.stringify([from,to,relation]);
    edges.set(key,[from,to,relation]);
  }
  const accountNode=node('cloudflare:account:'+account,'Cloudflare account',account,'verified-leaf');
  const gitNode=node('github:repo:'+repo,'GitHub repository',repo,'verified-leaf');
  for (const record of inventory.resources) {
    const key=node('cloudflare:'+record.kind+':'+record.id,'Cloudflare '+record.kind,record.name,'indexed',record.details??{});
    if(owned[record.kind])owned[record.kind].set(record.name.toLowerCase(),key);
    edge(key,accountNode,'owned by');
  }
  const vaultNode='cloudflare:d1:'+vault;
  const buildNode='cloudflare:d1:'+build;
  node(vaultNode,'Cloudflare d1','tabor-holding-vault');
  node(buildNode,'Cloudflare d1','tabor-autonomous-builds');
  edge(vaultNode,accountNode,'owned by');
  edge(buildNode,accountNode,'owned by');
  for(const t of inventory.tables){
    const db=node('cloudflare:d1:'+t.database,'Cloudflare d1',t.database);
    const id=node('d1:table:'+t.database+':'+t.name,'D1 '+t.type,t.name,'indexed',{rows:t.count??null});
    edge(db,accountNode,'owned by');
    edge(id,db,'stored in');
  }
  function file(path,ref){
    if(path.length>500||path.split('/').some(p=>p==='.'||p==='..')||/[\x00-\x1f]/.test(path))return null;
    if (!verifiedGit.paths.has(path) && !/^(app-factory|standalone-apps|integrations|projects|zones)\/(?:[\w .@-]+\/)*[\w .@-]+$/.test(path)) return null;
    const verified=verifiedGit.paths.get(path);
    const revision=typeof ref==='string'&&/^[a-f0-9]{40}$/.test(ref)?ref:null;
    const matched=verified && (!revision||revision===verifiedGit.commit);
    const chosenRef=matched?verifiedGit.commit:revision;
    const key='github:path:'+String(chosenRef??'unresolved')+':'+path;
    if(matched && verifiedGit.catalogued) return key;
    node(key,'GitHub path',path,matched?'indexed':'unresolved',matched?{blob:verified,commit:chosenRef}:chosenRef?{commit:chosenRef}:{});
    if(matched) {
      const blob=node('github:blob:'+verified,'GitHub blob',verified,'indexed');
      const commit=node('github:commit:'+chosenRef,'GitHub commit',chosenRef,'indexed');
      edge(key,blob,'contains');
      edge(blob,commit,'verified at');
      edge(commit,gitNode,'in repository');
    }else edge(key,gitNode,'declared in');
    return key;
  }
  function refLink(raw,ref){
    if(typeof raw!=='string')return null;
    const trimmed=raw.trim();
    if(!trimmed||trimmed.length>2000)return null;
    if(!/^https?:\/\//i.test(trimmed))return file(trimmed,ref);
    let u;
    try{u=new URL(trimmed);}catch{return null;}
    if(u.username||u.password)return null;
    const host=u.hostname.toLowerCase();
    if(host==='github.com'&&u.pathname.toLowerCase().startsWith('/'+repo.toLowerCase()+'/')){
      const match=/^\/[^/]+\/[^/]+\/(?:blob|tree)\/([^/]+)\/(.*)$/.exec(u.pathname);
      if(match){try{return file(decodeURIComponent(match[2]),match[1]);}catch{return null;}}
      return gitNode;
    }
    if(host.endsWith('.nathantaboract.workers.dev')){
      const key=owned.worker.get(host.replace(/\.nathantaboract\.workers\.dev$/,''));
      if(key)return key;
    }
    if(host.endsWith('.pages.dev')){
      const key=owned.pages.get(host.split('.').at(-3));
      if(key)return key;
    }
    if(host==='dash.cloudflare.com'&&u.pathname.startsWith('/'+account+'/')){
      const key=/\/d1\/databases\/([a-f0-9-]{36})\b/.exec(u.pathname)?.[1];
      return key ? node('cloudflare:d1:'+key,'Cloudflare d1',key) : accountNode;
    }
    const ownedHost=host.endsWith('.nathantaboract.workers.dev');
    const label=ownedHost?u.origin+u.pathname:u.origin;
    return node('reference:'+label,'Referenced link',label,ownedHost?'unresolved':'external-reference');
  }
  function selectedSnapshotRevision(ref) { return ref===verifiedGit.commit || ref==='main' || ref==='refs/heads/main'; }
  function parse(value) { try{return JSON.parse(value);}catch{return null;} }
  function collect(value,visit){
    const stack=[value], seen=new Set();
    while(stack.length){
      const v=stack.pop();
      if(v===null||v===undefined)continue;
      if(typeof v==='object'){stack.push(...Object.values(v));continue;}
      if(typeof v!=='string'||seen.has(v))continue;
      seen.add(v);
      if(/^[\[{]/.test(v.trim())){const nested=parse(v);if(nested)stack.push(nested);}
      visit(v);
      for(const match of v.matchAll(/https?:\/\/[^\s"'<>\)\]\}]+/g))if(match[0]!==v)visit(match[0]);
    }
  }
  const tables=new Set(inventory.tables.filter(t=>t.database===build).map(t=>t.name));
  let cursor=after;
  for(;;){
    const {results}=await query(vault,"SELECT rowid,workspace_id,source_table,source_id,source_ref,snapshot_json,snapshot_sha256 FROM zone_components WHERE rowid>? AND rowid<=? ORDER BY rowid LIMIT 160",[cursor,through]);
    for(const row of results){
      cursor=row.rowid;
      counted.components++;
      const zone=node('zone:'+row.workspace_id,'Holding zone',row.workspace_id);
      const component=node('component:'+JSON.stringify([row.workspace_id,row.source_table,row.source_id]),'Staged record',row.source_id,'indexed',{snapshot_sha256:row.snapshot_sha256});
      edge(zone,component,'contains');
      edge(zone,vaultNode,'staged in');
      const snapshot=parse(row.snapshot_json)??{};
      const stageTable=row.source_table==='sovereign_app_unit_package_v1'?'sovereign_app_unit_v1':row.source_table;
      if(tables.has(stageTable)){
        const table=node('d1:table:'+build+':'+stageTable,'D1 table',stageTable);
        const record=node('d1:row:'+stageTable+':'+row.source_id,'D1 source row reference',row.source_id,'indexed',{table:stageTable});
        edge(component,record,'snapshot of');
        edge(record,table,'stored in');
      }
      if(row.source_table.startsWith('zone_companion_')&&typeof snapshot.workspace_id==='string'){
        edge(component,node('zone:'+snapshot.workspace_id,'Holding zone',snapshot.workspace_id),'companion zone');
      }
      if (verifiedGit.paths.has(row.source_ref) && (!snapshot.source_commit || selectedSnapshotRevision(snapshot.source_commit))) {
        const verified=file(row.source_ref,null);
        if(verified)edge(component,verified,'verified GitHub reference');
      }
      for(const raw of [row.source_ref,snapshot.source_ref,snapshot.source_path]){
        const t=refLink(raw,snapshot.source_commit);
        if(t)edge(component,t,'source reference');
      }
      collect(snapshot,raw=>{
        const t=refLink(raw,snapshot.source_commit);
        if(t){edge(component,t,'embedded reference');counted.embeddedReferences++;}
      });
    }
    if(results.length<160)break;
  }
  const sqlNode=`INSERT INTO zone_reader_provenance_nodes(node_key,kind,locator,resolution,details_json)
    SELECT json_extract(value,'$[0]'),json_extract(value,'$[1]'),json_extract(value,'$[2]'),json_extract(value,'$[3]'),json_extract(value,'$[4]')
    FROM json_each(?) WHERE 1 ON CONFLICT(node_key) DO UPDATE SET
      kind=excluded.kind,locator=excluded.locator,resolution=excluded.resolution,details_json=excluded.details_json
    WHERE zone_reader_provenance_nodes.resolution<>excluded.resolution OR zone_reader_provenance_nodes.details_json<>excluded.details_json`;
  const sqlEdge=`INSERT INTO zone_reader_provenance_edges(source_key,target_key,relation)
    SELECT json_extract(value,'$[0]'),json_extract(value,'$[1]'),json_extract(value,'$[2]')
    FROM json_each(?) WHERE 1 ON CONFLICT DO NOTHING`;
  async function write(statement,values){
    const rows=Array.from(values);
    let changes=0;
    for(let i=0;i<rows.length;i+=220){
      changes+=(await query(vault,statement,[JSON.stringify(rows.slice(i,i+220))])).meta.changes;
    }
    return changes;
  }
  const nodesWritten=await write(sqlNode,nodes.values());
  const edgesWritten=await write(sqlEdge,edges.values());
  return {...counted,nodes:nodes.size,edges:edges.size,nodesWritten,edgesWritten};
}
