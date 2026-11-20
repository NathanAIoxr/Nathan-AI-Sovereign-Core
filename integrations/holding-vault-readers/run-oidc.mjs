import {execFileSync} from 'node:child_process';
import {REPOSITORY,validManifest} from './readers.mjs';

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
  if(!r.ok)throw Error('Reader service returned HTTP '+r.status);
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
  console.log(JSON.stringify(await call('POST',verified)));
}
