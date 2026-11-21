// Nathan AI typed restoration atlas.
// This is a read-only catalog, never an executor or a third-party code installer.
const json=(data,status=200)=>Response.json(data,{status,headers:{
  "cache-control":"no-store",
  "x-content-type-options":"nosniff",
  "referrer-policy":"no-referrer"
}});
const safe=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function authenticated(request,env) {
  if(!env.RESTORE_READ_KEY)return false;
  const h=request.headers.get("authorization")||"";
  if(h==="Bearer "+env.RESTORE_READ_KEY)return true;
  if(h.startsWith("Basic ")){
    try{return atob(h.slice(6))==="restore:"+env.RESTORE_READ_KEY}catch{return false}
  }
  return false;
}
const unauthorized=()=>new Response("Private resource details require authorization",{
  status:401,headers:{"www-authenticate":'Basic realm="Nathan AI Resource Atlas"',"cache-control":"no-store"}
});
async function overview(env){
  const [total,types,sources,links]=await Promise.all([
    env.CATALOG.prepare("SELECT COUNT(*) AS count FROM restored_resources_v1").first(),
    env.CATALOG.prepare("SELECT resource_kind,operational_state,COUNT(*) AS n FROM restored_resources_v1 GROUP BY resource_kind,operational_state ORDER BY n DESC").all(),
    env.CATALOG.prepare("SELECT source_db,source_table,COUNT(*) AS n FROM restored_resources_v1 GROUP BY source_db,source_table ORDER BY source_db,source_table").all(),
    env.CATALOG.prepare("SELECT COUNT(*) AS n FROM restored_resource_links_v1").first()
  ]);
  const snapshots=await env.CATALOG.prepare("SELECT COUNT(*) AS n FROM dispatch_script_snapshots").first();
  return {total_records:total?.count||0,relationship_links:links?.n||0,
    private_source_snapshots:snapshots?.n||0,
    classifications:types.results||[],source_tables:sources.results||[]};
}
function page(summary){
  const byKind=new Map();
  for(const group of summary.classifications){
    byKind.set(group.resource_kind,(byKind.get(group.resource_kind)||0)+group.n);
  }
  const kinds=[...byKind].sort((a,b)=>b[1]-a[1])
    .map(([kind,n])=>"<tr><td>"+safe(kind)+"</td><td>"+n.toLocaleString("en-US")+"</td></tr>").join("");
  return '<!doctype html><html lang="en"><head><meta charset="utf-8">'+
    '<meta name="viewport" content="width=device-width,initial-scale=1">'+
    '<title>Nathan AI — Restored Resource Atlas</title>'+
    '<style>body{background:#0b1020;color:#e7eef9;font:16px system-ui;margin:0;padding:20px;max-width:950px}'+
    'h1{font-size:clamp(1.5rem,4vw,2.6rem);margin:.4rem 0}p{color:#bdcbe0;line-height:1.45}'+
    'strong{color:#ffffff}a{color:#91ddff}section{margin-top:20px}table{width:100%;border-collapse:collapse}'+
    'td,th{text-align:left;padding:10px;border-bottom:1px solid #35435d}th{color:#b6c7dd}'+
    '.metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:12px}'+
    '.tile{padding:16px;background:#17213a;border:1px solid #35435d;border-radius:12px}'+
    '.number{font-size:1.7rem;font-weight:700}small{color:#b8c7dc}'+
    '</style></head><body><h1>NATHAN AI 🚀 — RESTORED RESOURCE ATLAS</h1>'+
    '<p>Original source records, relationships and operational status are preserved separately. A repository, technology reference, or logical slot is not a deployed Worker.</p>'+
    '<div class="metrics">'+
    '<div class="tile"><div class="number">'+summary.total_records.toLocaleString("en-US")+'</div><small>Original records</small></div>'+
    '<div class="tile"><div class="number">'+summary.relationship_links.toLocaleString("en-US")+'</div><small>Source relationships</small></div>'+
    '<div class="tile"><div class="number">'+summary.private_source_snapshots.toLocaleString("en-US")+'</div><small>Private script snapshots</small></div></div>'+
    '<section><p><a href="/api/summary">Read structured summary</a> · <a href="/api/public-repositories">Explore external repository references</a></p>'+
    '<p>Private record drill-down is disabled until the owner configures RESTORE_READ_KEY. No arbitrary script execution or external repository cloning is enabled.</p></section>'+
    '<section><h2>Resource categories</h2><table><thead><tr><th>Type</th><th>Records</th></tr></thead><tbody>'+kinds+'</tbody></table></section></body></html>';
}
export default {
  async fetch(request,env){
    if(request.method!=="GET")return json({error:"GET only"},405);
    const u=new URL(request.url);
    if(u.pathname==="/health")return json({ok:true,service:"nathan-ai-resource-restoration",role:"read-only provenance viewer"});
    if(u.pathname==="/"||u.pathname==="/api/summary"){
      try{
        const data=await overview(env);
        if(u.pathname==="/api/summary")return json({ok:true,...data,notice:"Record counts include mirrors and logical references; not a count of executable Workers"});
        return new Response(page(data),{headers:{
          "content-type":"text/html; charset=utf-8","cache-control":"no-store",
          "content-security-policy":"default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'"
        }});
      }catch(e){return json({ok:false,error:"source registry unavailable"},503)}
    }
    if(u.pathname==="/api/public-repositories"){
      const n=Number(u.searchParams.get("limit")||25),offset=Number(u.searchParams.get("offset")||0);
      if(!Number.isSafeInteger(n)||n<1||n>50||!Number.isSafeInteger(offset)||offset<0||offset>2000)
        return json({error:"limit 1-50, offset 0-2000"},400);
      const results=await env.CATALOG.prepare(
        "SELECT uid,label,source_url,declared_status,operational_state,original_record_json FROM restored_resources_v1 "+
        "WHERE resource_kind='external_repository' ORDER BY label LIMIT ? OFFSET ?"
      ).bind(n,offset).all();
      return json({ok:true,count:results.results?.length||0,offset,
        entries:(results.results||[]).map(r=>({
          uid:r.uid,name:r.label,repository_url:r.source_url,source_status:r.declared_status,
          operational_state:r.operational_state,category:JSON.parse(r.original_record_json).category,
          integration_fit:JSON.parse(r.original_record_json).fit
        })),
        note:"Reference-only upstream repositories. No licensing review, cloning, or installation implied."});
    }
    if(u.pathname.startsWith("/api/private/")){
      if(!authenticated(request,env))return unauthorized();
      if(u.pathname==="/api/private/record"){
        const uid=u.searchParams.get("uid")||"";
        if(!uid||uid.length>512)return json({error:"uid required (max 512 characters)"},400);
        const record=await env.CATALOG.prepare(
          "SELECT uid,source_db,source_table,source_id,resource_kind,custody,label,source_url,declared_status,operational_state,license_declared,original_record_json,code_snapshot_ref,observed_at,restored_at FROM restored_resources_v1 WHERE uid=?"
        ).bind(uid).first();
        if(!record)return json({error:"not found"},404);
        const related=await env.CATALOG.prepare(
          "SELECT from_uid,to_uid,relationship,evidence FROM restored_resource_links_v1 WHERE from_uid=? OR to_uid=? ORDER BY relationship LIMIT 100"
        ).bind(uid,uid).all();
        return json({ok:true,record:{...record,original_record:JSON.parse(record.original_record_json),original_record_json:undefined},
          relationships:related.results||[],code_snapshot_private:true});
      }
      if(u.pathname==="/api/private/find"){
        const q=(u.searchParams.get("q")||"").trim();
        const kind=u.searchParams.get("kind")||"";
        const limit=Number(u.searchParams.get("limit")||25);
        if(q.length>80||kind.length>80||!Number.isSafeInteger(limit)||limit<1||limit>50)return json({error:"invalid filters"},400);
        const escaped=q.replace(/[\\%_]/g,"\\$&");
        const results=await env.CATALOG.prepare(
          "SELECT uid,resource_kind,label,source_db,source_table,source_url,declared_status,operational_state FROM restored_resources_v1 "+
          "WHERE (?='' OR resource_kind=?) AND (?='' OR label LIKE ? ESCAPE '\\') ORDER BY label LIMIT ?"
        ).bind(kind,kind,q,"%"+escaped+"%",limit).all();
        return json({ok:true,results:results.results||[]});
      }
      return json({error:"not found"},404);
    }
    return json({error:"not found"},404);
  },
  async scheduled(controller,env,ctx){
    ctx.waitUntil((async()=>{
      try{
        const [counts,unlinked]=await Promise.all([
          env.CATALOG.prepare("SELECT (SELECT COUNT(*) FROM restored_resources_v1) AS restored,(SELECT COUNT(*) FROM unified_catalog) AS indexed,(SELECT COUNT(*) FROM restored_resource_links_v1) AS relationships").first(),
          env.CATALOG.prepare("SELECT COUNT(*) AS n FROM restored_resources_v1 r LEFT JOIN unified_catalog u ON u.uid=r.uid WHERE u.uid IS NULL").first()
        ]);
        await env.CATALOG.prepare(
          "INSERT INTO cockpit_log(tier,action,state,payload,created_at) VALUES(?,?,?,?,?)"
        ).bind("RESTORE","RESOURCE_ATLAS_RECONCILIATION",unlinked?.n===0?1:0,
          JSON.stringify({...counts,missing_from_index:unlinked?.n||0,cron:controller.cron}),
          new Date().toISOString()).run();
      }catch(e){
        await env.CATALOG.prepare(
          "INSERT INTO cockpit_log(tier,action,state,payload,created_at) VALUES(?,?,?,?,?)"
        ).bind("RESTORE","RESOURCE_ATLAS_RECONCILIATION_ERROR",0,String(e.message||e).slice(0,250),new Date().toISOString()).run();
      }
    })());
  }
};
