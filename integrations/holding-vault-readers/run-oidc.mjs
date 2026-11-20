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
let token;
let renewedAt=0;
async function call(method,body,endpoint=reader) {
  if(!token||Date.now()-renewedAt>120000){
    const issued=await fetch(oidcUrl,{headers:{Authorization:'Bearer '+auth},signal:AbortSignal.timeout(20000),redirect:'error'});
    if(!issued.ok)throw Error('GitHub OIDC returned '+issued.status);
    ({value:token}=await issued.json());
    if(typeof token!=='string')throw Error('GitHub OIDC assertion unavailable');
    renewedAt=Date.now();
  }

  const payload=body===undefined?undefined:JSON.stringify(body);
  for(let attempt=0;attempt<3;attempt++){
    const response=await fetch(base+endpoint,{method,body:payload,
      headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
      signal:AbortSignal.timeout(60000),redirect:'error'});
    if(response.status===423)return {reader:endpoint,paused:true};
    if(response.ok)return response.json();
    if(response.status!==401||attempt===2)throw Error('Reader service returned HTTP '+response.status);
    await response.body?.cancel();
    await new Promise(resolve=>setTimeout(resolve,750*(attempt+1)));
  }
}
if(reader==='cloudflare'){
  console.log(JSON.stringify(await call('POST')));
}else{
  const commit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
  if(commit!==process.env.GITHUB_SHA)throw Error('Checkout differs from workflow commit');
  const {paths,paused}=await call('GET');
  if(paused){console.log(JSON.stringify({reader,paused}));process.exit(0);}
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
  const status=await call('GET',undefined,'github-tree');
  const publish=!status.complete&&!status.paused;
  const scan=scanGitContent(commit,REPOSITORY,{includeGraph:publish});
  const coverage=publish?scan.summary:scan;
  console.log(JSON.stringify(await call('POST',{manifests:verified,coverage})));
  if(publish){
    for(const kind of ['nodes','edges']){
      for(let i=0;i<scan[kind].length;i+=150){
        const batch=await call('POST',{kind,rows:scan[kind].slice(i,i+150)},'github-tree');
        if(batch.paused){console.log(JSON.stringify(batch));process.exit(0);}
      }
    }
    console.log(JSON.stringify(await call('POST',{kind:'finish',entries:scan.nodes.length,links:scan.edges.length},'github-tree')));
  }
}
