import {VAULT,BUILD_LEDGER,REPOSITORY,validManifest,manifestRows,githubCandidates,cloudflareCandidates,persist} from './readers.mjs';

const ISSUER='https://token.actions.githubusercontent.com';
const AUDIENCE='https://tabor-bridge.nathantaboract.workers.dev/vault-reader-jobs/';
const WORKFLOW=(REPOSITORY+'/.github/workflows/holding-vault-reader-bots.yml@refs/heads/main').toLowerCase();
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const reply=(body,status=200)=>Response.json(body,{status,headers});

function decode(value) {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw Error('Invalid JWT segment');
  return Uint8Array.from(atob(value.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));
}

export async function authenticate(request,loadKeys=()=>fetch(ISSUER+'/.well-known/jwks',{redirect:'error',signal:AbortSignal.timeout(5000)})) {
  const token=request.headers.get('Authorization')?.match(/^Bearer ([A-Za-z0-9_.-]{1,16000})$/)?.[1];
  if (!token) return null;
  try {
    const parts=token.split('.');
    if(parts.length!==3)return null;
    const [a,b,c]=parts;
    const decoder=new TextDecoder();
    const header=JSON.parse(decoder.decode(decode(a)));
    const claims=JSON.parse(decoder.decode(decode(b)));
    const now=Math.floor(Date.now()/1000);
    if(header.alg!=='RS256'||typeof header.kid!=='string'||claims.iss!==ISSUER||claims.aud!==AUDIENCE) return null;
    if(claims.repository_id!=='1038249626'||claims.repository?.toLowerCase()!==REPOSITORY.toLowerCase()||claims.workflow_ref?.toLowerCase()!==WORKFLOW||claims.ref!=='refs/heads/main')return null;
    if(!['push','schedule','workflow_dispatch'].includes(claims.event_name)||!/^\d+$/.test(claims.run_id??'')||!/^\d+$/.test(claims.run_attempt??'')||!/^[a-f0-9]{40}$/.test(claims.sha??''))return null;
    if(!Number.isFinite(claims.exp)||!Number.isFinite(claims.nbf)||claims.exp<=now||claims.nbf>now+10||claims.exp>now+900)return null;
    const response=await loadKeys();
    if(!response.ok)return null;
    const {keys}=await response.json();
    const jwk=keys.find(k=>k.kid===header.kid&&k.kty==='RSA');
    if(!jwk)return null;
    const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
    return await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,decode(c),new TextEncoder().encode(a+'.'+b)) ? claims : null;
  } catch {
    return null;
  }
}

export default {
  async fetch(request,env) {
    const url=new URL(request.url);
    if(!['/github','/cloudflare'].includes(url.pathname)||url.search)return reply({error:'Not found'},404);
    const reader=url.pathname.slice(1);
    if(!(request.method==='POST'||(request.method==='GET'&&reader==='github')))return reply({error:'Method not allowed'},405);
    const claims=await authenticate(request);
    if(!claims)return reply({error:'Reader workflow identity required'},401);
    const query=(db,sql,params=[])=>{
      if(db===BUILD_LEDGER&&/^SELECT\s/i.test(sql))return env.BUILD.prepare(sql).bind(...params).all();
      if(db===VAULT)return env.VAULT.prepare(sql).bind(...params).all();
      throw Error('Unknown reader database');
    };
    try {
      const runId='github-actions-'+claims.run_id+'-'+claims.run_attempt;
      if(reader==='cloudflare'){
        const {rowsRead,candidates}=await cloudflareCandidates(query);
        return reply(await persist(query,reader,runId,'D1 tabor-autonomous-builds and tabor-holding-vault',rowsRead,candidates));
      }
      const rows=await manifestRows(query);
      if(request.method==='GET')return reply({paths:[...new Set(rows.map(x=>x.source_ref).filter(validManifest))]});
      const length=Number(request.headers.get('Content-Length')??0);
      if(!Number.isFinite(length)||length>450000)return reply({error:'Reader batch too large'},413);
      const raw=await request.text();
      if(raw.length>450000)return reply({error:'Reader batch too large'},413);
      let pairs;
      try{pairs=JSON.parse(raw);}catch{return reply({error:'Invalid JSON batch'},400);}
      if(!Array.isArray(pairs)||pairs.length>3000||pairs.some(x=>!Array.isArray(x)||x.length!==2||typeof x[0]!=='string'||!validManifest(x[0])||!/^[a-f0-9]{40}$/.test(x[1]??'')))return reply({error:'Invalid manifest evidence'},400);
      return reply(await persist(query,reader,runId,REPOSITORY+'@'+claims.sha,rows.length,githubCandidates(rows,new Map(pairs),claims.sha)));
    } catch {
      return reply({error:'Reader job failed'},503);
    }
  }
};
