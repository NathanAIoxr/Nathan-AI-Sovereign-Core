// Native Cloudflare Worker. Read-only source databases; additive destination upserts.
const TABLES=[
 ["GLOBAL_DB","tabor-global-import-catalog",["global_atlas_public_repos","global_atlas_components","global_atlas_layers","global_atlas_sources","imported_workers","global_atlas_existing_fleet"]],
 ["FLEET_DB","tabor-fleet-registry",["fleet_entry","virtual_supercomputer_slot_v1"]],
 ["MASTER_DB","nathan-ai-global-catalog",["catalog_items"]]
];
const response=(data,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
const encoder=new TextEncoder();
const equal=(a,b)=>{const x=encoder.encode(a||""),y=encoder.encode(b||"");let v=x.length^y.length;for(let i=0;i<Math.max(x.length,y.length);i++)v|=(x[i]||0)^(y[i]||0);return v===0};
const keyOf=(r,i)=>String(r.item_id??r.repo??r.id??r.fleet_id??r.slot??r.name??r.source_id??i);
const labelOf=(r,id)=>String(r.name??r.title??r.repo??r.worker_name??r.node_id??r.item_id??id);
const pickUrl=r=>{const s=r.repo_url??r.url??r.source_url??null;return typeof s==="string"&&s.startsWith("https://")?s:null};
async function sourceRows(db,table){const q='"'+table.replaceAll('"','""')+'"';const {results:cols}=await db.prepare("PRAGMA table_info("+q+")").all();if(!cols?.length)throw Error("missing table: "+table);const {results}=await db.prepare("SELECT * FROM "+q).all();return results||[]}
async function importAll(env){
 const summary={};let total=0;const stamp=new Date().toISOString();
 const run=await env.DB.prepare("INSERT INTO import_runs(started_at,state) VALUES(?,'RUNNING')").bind(stamp).run();
 const runId=run.meta?.last_row_id;
 try{
  for(const [binding,dbName,explicit] of TABLES){
   const db=env[binding];if(!db)throw Error("missing D1 binding "+binding);
   const {results:discovered}=await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%'").all();
   const available=new Set((discovered||[]).map(x=>x.name));
   // Master table names discovered from SQLite; only actual catalog items imported.
   const names=binding==="MASTER_DB"?(available.has("catalog_items")?["catalog_items"]:[]):explicit;
   if(binding==="MASTER_DB"&&!names.length)throw Error("master catalog_items table absent; refusing to import logs as catalog");
   for(const table of names){
    if(!available.has(table))throw Error("missing "+dbName+"."+table);
    const rows=await sourceRows(db,table);let n=0;
    for(let offset=0;offset<rows.length;offset+=20){
     const stmts=rows.slice(offset,offset+20).map((r,i)=>{
      const sourceId=keyOf(r,offset+i);
      const uid=dbName+":"+table+":"+sourceId;
      return env.DB.prepare(`INSERT INTO unified_catalog(uid,source_db,source_table,source_id,name,category,repo_url,source_status,updated_at)
       VALUES(?,?,?,?,?,?,?,?,?)
       ON CONFLICT(uid) DO UPDATE SET name=excluded.name,category=excluded.category,repo_url=excluded.repo_url,source_status=excluded.source_status,updated_at=excluded.updated_at`)
       .bind(uid,dbName,table,sourceId,labelOf(r,sourceId),String(r.category??r.layer??table),pickUrl(r),String(r.status??r.state??r.source_state??(table==="virtual_supercomputer_slot_v1"?"INDEXED_ONLY":"REFERENCE")),stamp);
     });
     await env.DB.batch(stmts);n+=stmts.length;
    }
    summary[dbName+"."+table]=n;total+=n;
   }
  }
  await env.DB.prepare("UPDATE import_runs SET state='SUCCESS',finished_at=?,summary=? WHERE id=?").bind(new Date().toISOString(),JSON.stringify(summary),runId).run();
  return {total,summary,run_id:runId};
 }catch(e){
  await env.DB.prepare("UPDATE import_runs SET state='FAILED',finished_at=?,summary=? WHERE id=?").bind(new Date().toISOString(),JSON.stringify({error:String(e),partial:summary}),runId).run();
  throw e;
 }
}
export default {
 async fetch(request,env){
  const u=new URL(request.url),auth=request.headers.get("Authorization")||"";
  if(!env.COCKPIT_KEY||!auth.startsWith("Bearer ")||!equal(auth.slice(7),env.COCKPIT_KEY))return response({error:"unauthorized"},401);
  try{
   if(request.method==="GET"&&u.pathname==="/api/platforms")return response({namespace:"nathan-tabor-platforms",binding_present:Boolean(env.PLATFORMS),script_count_verified:false,script_count:null});
   if(request.method==="GET"&&u.pathname==="/api/catalog"){
    const limit=Math.min(100,Math.max(1,Number(u.searchParams.get("limit"))||25));
    const offset=Math.max(0,Number(u.searchParams.get("offset"))||0);
    const source=u.searchParams.get("source");
    const q=source?"SELECT * FROM unified_catalog WHERE source_table=? ORDER BY uid LIMIT ? OFFSET ?":"SELECT * FROM unified_catalog ORDER BY uid LIMIT ? OFFSET ?";
    const params=source?[source,limit,offset]:[limit,offset];
    const {results}=await env.DB.prepare(q).bind(...params).all();return response({items:results||[],limit,offset});
   }
   if(request.method==="GET"&&u.pathname==="/api/status"){
    const {results}=await env.DB.prepare("SELECT source_db,source_table,COUNT(*) count FROM unified_catalog GROUP BY source_db,source_table ORDER BY source_db,source_table").all();
    return response({sources:results||[],platform_binding_present:Boolean(env.PLATFORMS)});
   }
   if(request.method==="POST"&&u.pathname==="/api/import"){
    const result=await importAll(env);
    await env.DB.prepare("INSERT INTO cockpit_log(tier,action,state,payload,created_at) VALUES('MICRO','CATALOG_IMPORT',1,?,?)").bind(JSON.stringify(result),new Date().toISOString()).run();
    return response(result);
   }
   return response({error:"not_found"},404);
  }catch(e){return response({error:"operation_failed",detail:String(e).slice(0,400)},500)}
 }
};
