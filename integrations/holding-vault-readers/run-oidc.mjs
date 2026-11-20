import {execFileSync} from 'node:child_process';
import {REPOSITORY,validManifest} from './readers.mjs';
import {scanGitContent} from './github-content.mjs';

const base='https://tabor-bridge.nathantaboract.workers.dev/vault-reader-jobs/';
const reader=process.argv[2];
if(!['github','cloudflare'].includes(reader)||process.env.GITHUB_REPOSITORY?.toLowerCase()!==REPOSITORY.toLowerCase())throw Error('Unexpected reader context');
const req=process.env.ACTIONS_ID_TOKEN_REQUEST_URL;
const auth=process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;
if(!req||!auth)throw Error('GitHub Actions OIDC identity unavailable');
const oidcUrl=new URL(req);
oidcUrl.searchParams.set('audience',base);
const issued=await fetch(oidcUrl,{headers:{Authorization:'Bearer '+auth},signal:AbortSignal.timeout(20000),redirect:'error'});
if(!issued.ok)throw Error('GitHub OIDC returned '+issued.status);
const {value:token}=await issued.json();
if(typeof token!=='string')throw Error('GitHub OIDC assertion unavailable');
async function call(method,body) {
  const r=await fetch(base+reader,{method,body:body===undefined?undefined:JSON.stringify(body),headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},signal:AbortSignal.timeout(60000),redirect:'error'});
  if(!r.ok){
    if(r.status===401){
      const c=JSON.parse(Buffer.from(token.split('.')[1],'base64url').toString('utf8'));
      const now=Math.floor(Date.now()/1000);
      console.log(JSON.stringify({
        accountRepository:String(c.repository_id)==='1038249626',
        repositoryIdIsString:typeof c.repository_id==='string',
        issuer:c.iss==='https://token.actions.githubusercontent.com',
        audience:c.aud===base,
        workflow:c.workflow_ref?.toLowerCase()===(REPOSITORY+'/.github/workflows/holding-vault-reader-bots.yml@refs/heads/main').toLowerCase(),
        branch:c.ref==='refs/heads/main',
        eventAllowed:['push','schedule','workflow_dispatch'].includes(c.event_name),
        validRunId:/^\d+$/.test(c.run_id??''),
        validAttempt:/^\d+$/.test(c.run_attempt??''),
        validSha:/^[a-f0-9]{40}$/.test(c.sha??''),
        validity:Number.isFinite(c.exp)&&Number.isFinite(c.nbf)&&c.exp>now&&c.nbf<=now+10&&c.exp<=now+900,
        readerService:(await r.text()).includes('Reader workflow identity required')
      }));
    }
    throw Error('Reader service returned HTTP '+r.status);
  }
  return r.json();
}
if(reader==='cloudflare'){
  console.log(JSON.stringify(await call('POST')));
}else{
  const commit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
  if(commit!==process.env.GITHUB_SHA)throw Error('Checkout differs from workflow commit');
  const {paths}=await call('GET');
  const whitelisted=new Set(paths.filter(validManifest));
  const tree=execFileSync('git',['ls-tree','-rz',commit],{encoding:'utf8',maxBuffer:32*1024*1024});
  const verified=[];
  for(const line of tree.split('\0')){
    const match=/^100(?:644|755) blob ([a-f0-9]{40})\t(.+)$/.exec(line);
    if(!match||!whitelisted.has(match[2]))continue;
    try{
      const data=JSON.parse(execFileSync('git',['cat-file','blob',match[1]],{encoding:'utf8',maxBuffer:128*1024}));
      if(data&&typeof data==='object'&&!Array.isArray(data))verified.push([match[2],match[1]]);
    }catch(error){if(!(error instanceof SyntaxError))throw error;}
  }
  const coverage=scanGitContent(commit,REPOSITORY);
  console.log(JSON.stringify(await call('POST',{manifests:verified,coverage})));
}
