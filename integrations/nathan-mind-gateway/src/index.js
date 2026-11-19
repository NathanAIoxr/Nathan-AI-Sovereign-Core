// Nathan Mind Fleet Gateway: read-only starter with no secrets or destructive actions.
// Deploy with Wrangler after binding a D1 database as DB and enabling authenticated access.
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
const sha=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(x=>x.toString(16).padStart(2,'0')).join('');
const anchors=['BUILD','FLIP','QI','QE'];
const classify=(value)=>{const s=value.toLowerCase();return {tier:/delete|destroy|publish|deploy|rotate secret|transfer|payment/.test(s)?'CERO':/verify|check|audit|compare|inspect/.test(s)?'UNO':'DOS',anchors:anchors.filter(a=>s.includes(a.toLowerCase())),note:'Heuristic routing only; CERO is approval-required, not automatic deletion'}};
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(url.pathname==='/health'&&request.method==='GET')return json({ok:true,service:'nathan-mind-gateway',version:'0.1.0',deployment_verified:false});
  // All non-health endpoints require an explicitly configured bearer token.
  if(!env.API_TOKEN)return json({error:'API_TOKEN binding not configured'},503);
  if(request.headers.get('authorization')!=='Bearer '+env.API_TOKEN)return json({error:'unauthorized'},401);
  if(url.pathname==='/registry'&&request.method==='GET'){
   if(!env.DB)return json({error:'DB binding missing'},503);
   const result=await env.DB.prepare('SELECT id,kind,name,domain,status,script_name,route,last_verified_at FROM nt_units ORDER BY id LIMIT 250').all();
   return json({units:result.results,verified_live_count:result.results.filter(x=>x.status==='verified_live').length});
  }
  if(request.method!=='POST')return json({error:'not_found'},404);
  const size=Number(request.headers.get('content-length')||0);
  if(size>100000)return json({error:'request_too_large'},413);
  let input;try{input=await request.json()}catch{return json({error:'invalid_json'},400)}
  if(!input||typeof input.text!=='string'||input.text.length>50000)return json({error:'text_required_max_50000'},400);
  if(url.pathname==='/hash')return json({sha256:await sha(input.text),utf8_bytes:new TextEncoder().encode(input.text).length});
  if(url.pathname==='/flip')return json({original:input.text,reverse_codepoints:[...input.text].reverse().join(''),reverse_lines:input.text.split(/\r?\n/).reverse().join('\n')});
  if(url.pathname==='/classify')return json(classify(input.text));
  if(url.pathname==='/dispatch'){
   const classification=classify(input.text);
   return json({status:'dry_run_only',classification,requires_approval:classification.tier==='CERO',executed:false});
  }
  return json({error:'not_found'},404);
 }
};
