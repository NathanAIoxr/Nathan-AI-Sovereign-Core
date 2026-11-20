import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {posix} from 'node:path';

const bufferLimit = 32 * 1024 * 1024;
const objectLimit = 4 * 1024 * 1024;
const decoder = new TextDecoder('utf-8',{fatal:true});
const objectPattern = /^[a-f0-9]{40}$/;
const sensitiveName = /(^|\/)(\.env(?:\.|$)|id_(?:rsa|ed25519)(?:\.|$))|\.(?:pem|p12|pfx|key)$/i;

function git(args, options={}) {
  return execFileSync('git',args,{maxBuffer:bufferLimit,...options});
}

function readObjects(objects, accept) {
  if (!objects.length) return;
  const response = git(['cat-file','--batch'],{input:objects.map(row=>row.oid).join('\n')+'\n'});
  let cursor=0;
  for (const {oid,size} of objects) {
    const end=response.indexOf(10,cursor);
    if(end<0||response.toString('ascii',cursor,end)!==oid+' blob '+size)throw Error('Git blob does not match its tree entry');
    const start=end+1;
    cursor=start+size+1;
    if(response[cursor-1]!==10)throw Error('Incomplete Git blob');
    accept(oid,response.subarray(start,cursor-1));
  }
  if(cursor!==response.length)throw Error('Unexpected Git object output');
}

function localTarget(raw, source, files, repository, commit) {
  if (!raw || raw.length > 600) return null;
  const clean = raw.split(/[?#]/,1)[0];
  if (!clean) return null;
  let decoded;
  try { decoded=decodeURIComponent(clean); } catch { return null; }
  if (/^https?:\/\//i.test(decoded)) {
    let url;
    try { url=new URL(decoded); } catch { return null; }
    const prefix='/'+repository.toLowerCase()+'/';
    if(url.hostname!=='github.com'||!url.pathname.toLowerCase().startsWith(prefix)||url.username||url.password)return null;
    const match=/^(?:blob|tree)\/([^/]+)\/(.+)$/.exec(url.pathname.slice(prefix.length));
    if (!match||!['main',commit].includes(match[1])) return null;
    return files.has(match[2]) ? match[2] : null;
  }
  if (decoded.startsWith('//')||decoded.includes(':')||!decoded.includes('/')&&!decoded.includes('.')) return null;
  const candidates = [
    posix.normalize(decoded.replace(/^\//,'')),
    posix.normalize(posix.join(posix.dirname(source),decoded))
  ];
  return candidates.find(path=>files.has(path))??null;
}

export function scanGitContent(commit, repository, {includeGraph=false}={}) {
  if (!objectPattern.test(commit)) throw Error('Expected a Git commit ID');
  const tree=git(['ls-tree','-rzt','-l',commit],{encoding:'utf8'});
  const files=new Map(), objects=new Map(), graphNodes=new Map();
  let submodules=0;
  for(const entry of tree.split('\0').filter(Boolean)) {
    const match=/^(\d{6}) (blob|commit|tree) ([a-f0-9]{40}) +(-|\d+)\t([\s\S]+)$/.exec(entry);
    if(!match) throw Error('Unexpected Git tree entry');
    const [,mode,kind,oid,bytes,path]=match;
    const parent=path.split('/').slice(0,-1).join('/');
    if(includeGraph && !sensitiveName.test(path)) graphNodes.set(path,[path,kind==='tree'?'directory':'gitlink',oid,null,null,parent]);
    if(kind==='tree')continue;
    if(kind==='commit'){submodules++;continue;}
    const size=Number(bytes);
    if(graphNodes.has(path)) {
      const node=graphNodes.get(path);
      node[1]=mode==='120000'?'symlink':'large-blob';
      node[4]=size;
    }
    files.set(path,{mode,oid,size});
    if(!objects.has(oid))objects.set(oid,{oid,size,paths:[]});
    objects.get(oid).paths.push(path);
  }
  const bySource=new Map(), parsedPaths=new Set(), linkedOrigins=new Set();
  const counts={trackedBlobs:files.size,textFiles:0,otherFiles:0,oversizeFiles:0,submodules};
  const digest=createHash('sha256');
  const reference=/(https?:\/\/[^\s"'<>\\)\]}]+)|\]\(([^\s)]+)\)|["']((?:\.{1,2}\/|\/)?[\w. @-]+(?:\/[\w. @-]+)+)["']/g;
  function inspect(oid,bytes) {
    const row=objects.get(oid);
    digest.update(oid);
    digest.update(bytes);
    const fileDigest=includeGraph?createHash('sha256').update(bytes).digest('hex'):null;
    for(const path of row.paths)if(graphNodes.has(path))graphNodes.get(path)[3]=fileDigest;
    let value;
    if(!bytes.includes(0)) {
      try { value=decoder.decode(bytes); } catch {}
    }
    if(value===undefined){
      counts.otherFiles+=row.paths.length;
      for(const path of row.paths)if(graphNodes.get(path)?.[1]==='large-blob')graphNodes.get(path)[1]='binary';
      return;
    }
    counts.textFiles+=row.paths.length;
    const references=new Set();
    for(const m of value.matchAll(reference))references.add(m[1]??m[2]??m[3]);
    for (const path of row.paths) {
      parsedPaths.add(path);
      const targets=new Set();
      for (const raw of references) {
        const target=localTarget(raw,path,files,repository,commit);
        if(target){if(target!==path)targets.add(target);continue;}
        if(/^https?:\/\//i.test(raw) && raw.length <= 600){
          try {
            const u=new URL(raw);
            if(!u.username&&!u.password)linkedOrigins.add(u.origin);
          }catch{}
        }
      }
      if(targets.size)bySource.set(path,targets);
      if(graphNodes.get(path)?.[1]==='large-blob')graphNodes.get(path)[1]=targets.size?'references-found':'no-static-reference';
    }
  }
  let batch=[], bytes=0;
  for(const row of objects.values()){
    if(row.size>objectLimit){counts.oversizeFiles+=row.paths.length;continue;}
    if(bytes+row.size>objectLimit*2){readObjects(batch,inspect);batch=[];bytes=0;}
    batch.push(row);
    bytes+=row.size;
  }
  readObjects(batch,inspect);

  const resolvedBranches=new Set(), reached=new Set(), pending=[...bySource.keys()];
  let internalReferences=0;
  for(const targets of bySource.values())internalReferences+=targets.size;
  while(pending.length){
    const path=pending.pop();
    if(reached.has(path))continue;
    reached.add(path);
    const targets=bySource.get(path);
    if(!targets&&parsedPaths.has(path))resolvedBranches.add(path);
    if(targets)for(const target of targets)pending.push(target);
  }
  const summary={...counts,internalReferences,linkedFiles:reached.size,terminalFiles:resolvedBranches.size,
    linkedOrigins:linkedOrigins.size,contentDigest:digest.digest('hex')};
  if(!includeGraph)return summary;
  const edges=[];
  for(const [from,targets] of bySource){
    if(!graphNodes.has(from)||graphNodes.get(from)[1]==='symlink')continue;
    for(const target of targets)if(graphNodes.has(target))edges.push([from,target]);
  }
  return {summary,nodes:[...graphNodes.values()],edges};
}
