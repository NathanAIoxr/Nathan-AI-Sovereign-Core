const issuer="https://token.actions.githubusercontent.com";
const repository="NathanAIoxr/Nathan-AI-Sovereign-Core";
const workflow=repository+"/.github/workflows/zone-switch.yml@refs/heads/main";
const audience="https://unified-operations-cockpit.nathantaboract.workers.dev/tabor-sites/conductor/cheironomer/internal/voice-proofs";
const utf8=new TextDecoder("utf-8",{fatal:true});
const decode=text=>Uint8Array.from(atob(text.replaceAll("-","+").replaceAll("_","/")),char=>char.charCodeAt(0));

export function allowedVoiceExport(claims,now) {
  return claims.iss===issuer && claims.aud===audience && String(claims.repository_id)==="1038249626" &&
    claims.repository?.toLowerCase()===repository.toLowerCase() && claims.ref==="refs/heads/main" && claims.workflow_ref?.toLowerCase()===workflow.toLowerCase() &&
    ["push","workflow_dispatch"].includes(claims.event_name) && Number.isFinite(claims.exp) && claims.exp>now && claims.exp<=now+900 &&
    Number.isFinite(claims.nbf) && claims.nbf<=now+10;
}

async function authorize(request,keys=fetch) {
  const token=request.headers.get("Authorization")?.match(/^Bearer ([a-zA-Z0-9_.-]{1,16000})$/)?.[1];
  if(!token)return false;
  try {
    const parts=token.split(".");
    if(parts.length!==3||parts.some(part=>!part))return false;
    const [head,body,signature]=parts;
    const header=JSON.parse(utf8.decode(decode(head)));
    const claims=JSON.parse(utf8.decode(decode(body)));
    if(header.alg!=="RS256"||typeof header.kid!=="string"||!allowedVoiceExport(claims,Date.now()/1000))return false;
    const response=await keys(issuer+"/.well-known/jwks",{redirect:"error",signal:AbortSignal.timeout(5000)});
    if(!response.ok)return false;
    const {keys:jwks}=await response.json();
    const jwk=jwks.find(key=>key.kid===header.kid&&key.kty==="RSA");
    if(!jwk)return false;
    const key=await crypto.subtle.importKey("jwk",jwk,{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["verify"]);
    return await crypto.subtle.verify("RSASSA-PKCS1-v1_5",key,decode(signature),new TextEncoder().encode(head+"."+body));
  }catch{return false;}
}

export async function voiceProofs(request,env,keys) {
  const headers={"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"};
  const reply=(value,status)=>Response.json(value,{status,headers});
  if(request.method!=="GET"||new URL(request.url).search) return reply({error:"method_or_query"},400);
  if(!await authorize(request,keys))return reply({error:"github_workflow_required"},401);
  const rows=await env.LEDGER.prepare(
    "SELECT event_id,source_hash,created_at FROM voice_vault ORDER BY created_at DESC,event_id LIMIT 1000"
  ).all();
  return reply({voiceEvidence:rows.results.map(({event_id,source_hash,created_at})=>({event_id,source_hash,created_at}))},200);
}
