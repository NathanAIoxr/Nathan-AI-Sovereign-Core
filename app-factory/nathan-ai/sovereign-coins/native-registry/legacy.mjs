// Read-only catalog for 63 historically documented entries; preserves existing mining tables.
const json=(x,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store","access-control-allow-origin":"*"}});
export default {async fetch(request,env){
 const u=new URL(request.url);if(request.method!=="GET")return json({error:"method_not_allowed"},405);
 if(u.pathname==="/health")return json({service:"nathan-coin-catalog",mode:"read-only",source:"live D1",blockchain_contracts_verified:false});
 if(!["/coins","/coins/summary"].includes(u.pathname))return json({service:"Nathan AI Coin Catalog",endpoints:["/health","/coins","/coins/summary"]});
 if(!env.DB)return json({error:"database_binding_unavailable"},503);
 try{
 if(u.pathname==="/coins/summary"){
 const rows=await env.DB.prepare("SELECT family,COUNT(*) AS entries FROM nathan_coin_catalog GROUP BY family ORDER BY family").all();
 const legacy=await env.DB.prepare("SELECT COUNT(*) AS entries FROM tabor_mining_coins").first();
 return json({historical_families:rows.results,historical_total:rows.results.reduce((n,x)=>n+Number(x.entries),0),legacy_mining_table:Number(legacy?.entries??0),warning:"Family records may share tickers; do not add table counts as unique blockchain assets"});
 }
 const family=u.searchParams.get("family");if(family&&!["grid42","matrix21"].includes(family))return json({error:"unknown_family"},400);
 const r=family?await env.DB.prepare("SELECT catalog_id,family,ticker,display_name,source_label,verification FROM nathan_coin_catalog WHERE family=? ORDER BY catalog_id").bind(family).all():await env.DB.prepare("SELECT catalog_id,family,ticker,display_name,source_label,verification FROM nathan_coin_catalog ORDER BY catalog_id").all();
 return json({count:r.results.length,entries:r.results,source:"Cloudflare D1",verification:"concept records only; no on-chain contracts established"});
 }catch{return json({error:"catalog_query_unavailable"},503)}
}};
