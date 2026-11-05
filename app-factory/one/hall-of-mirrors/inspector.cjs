'use strict';
/* THE NATHAN TABOR HALL OF MIRRORS — local passive inspection adapter.
   Original 101 words and mirror engine are untouched. All access is read-only.
   Does NOT execute samples, scan networks, quarantine, retaliate or claim antivirus coverage.
*/
const fs=require('node:fs/promises');
const fsConstants=require('node:fs').constants;
const path=require('node:path');
const crypto=require('node:crypto');
const original=require('./engine.js');
const MAX_FILES=512,MAX_DEPTH=5,MAX_BYTES=256*1024,MAX_TOTAL_BYTES=8*1024*1024;
const SUPPORTED=new Set(['.txt','.md','.js','.cjs','.mjs','.ts','.tsx','.py','.sh','.bash','.ps1','.bat','.cmd','.html','.json','.yaml','.yml','.xml','.sql','.conf','.ini','.log']);
function options(input={}){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Invalid inspection options');
 const v={maxFiles:input.maxFiles??MAX_FILES,maxDepth:input.maxDepth??MAX_DEPTH,maxBytes:input.maxBytes??MAX_BYTES,maxTotalBytes:input.maxTotalBytes??MAX_TOTAL_BYTES};
 for(const [k,cap]of [['maxFiles',MAX_FILES],['maxDepth',MAX_DEPTH],['maxBytes',MAX_BYTES],['maxTotalBytes',MAX_TOTAL_BYTES]]){
  if(!Number.isSafeInteger(v[k])||v[k]<1||v[k]>cap)throw Error(k+' must be a bounded positive integer');
 }
 if(typeof input.dir!=='string'||!path.isAbsolute(input.dir))throw Error('Use an explicit absolute local directory');
 return {...v,dir:path.resolve(input.dir)};
}
async function inspectLocal(input){
 const opts=options(input),root=opts.dir;
 const rootStat=await fs.lstat(root);
 if(!rootStat.isDirectory()||rootStat.isSymbolicLink())throw Error('Inspection root must be a real directory, not a symlink');
 const records=[];let inspectedBytes=0,limited=false;
 async function walk(dir,depth){
  if(records.length>=opts.maxFiles){limited=true;return}
  const entries=(await fs.readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name));
  for(const entry of entries){
   if(records.length>=opts.maxFiles){limited=true;return}
   const full=path.join(dir,entry.name);
   const relative=path.relative(root,full).split(path.sep).join('/');
   if(!relative||relative.startsWith('../')||path.isAbsolute(relative))throw Error('Untrusted directory path');
   if(entry.isSymbolicLink()){records.push({path:relative,status:'skipped-symlink'});continue}
   if(entry.isDirectory()){
    if(depth>=opts.maxDepth){records.push({path:relative,status:'skipped-depth-limit'});continue}
    await walk(full,depth+1);continue;
   }
   if(!entry.isFile()){records.push({path:relative,status:'skipped-nonregular'});continue}
   if(!SUPPORTED.has(path.extname(entry.name).toLowerCase())){records.push({path:relative,status:'skipped-file-type'});continue}
   const st=await fs.lstat(full);
   if(!st.isFile()||st.isSymbolicLink()){records.push({path:relative,status:'skipped-nonregular'});continue}
   if(st.size>opts.maxBytes){records.push({path:relative,status:'skipped-size-limit',bytes:st.size});continue}
   if(inspectedBytes+st.size>opts.maxTotalBytes){limited=true;records.push({path:relative,status:'skipped-total-byte-limit',bytes:st.size});continue}
   // Open with O_NOFOLLOW where available; check the opened object is regular and sized.
   let fd;
   try{
    fd=await fs.open(full,fsConstants.O_RDONLY|(fsConstants.O_NOFOLLOW||0));
    const actual=await fd.stat();
    if(!actual.isFile()||actual.size>opts.maxBytes||actual.size!==st.size||actual.ino!==st.ino||actual.dev!==st.dev){
      records.push({path:relative,status:'skipped-changed-file'});continue;
    }
    const data=await fd.readFile();
    if(data.length!==actual.size){records.push({path:relative,status:'skipped-changed-file'});continue}
    inspectedBytes+=data.length;
    const sha256=crypto.createHash('sha256').update(data).digest('hex');
    if(data.includes(0)){records.push({path:relative,status:'not-text',bytes:data.length,sha256});continue}
    // Pure content classifier from recovered original code; don't infer certainty.
    const decision=original.classify(data.toString('utf8'));
    records.push({path:relative,status:decision.detected?'review-pattern':'no-pattern-match',
      bytes:data.length,sha256,reasons:decision.reasons});
   }finally{if(fd)await fd.close()}
  }
 }
 await walk(root,0);
 const totals={entries:records.length,analyzed:records.filter(x=>x.status==='review-pattern'||x.status==='no-pattern-match').length,
  review:records.filter(x=>x.status==='review-pattern').length,
  noPattern:records.filter(x=>x.status==='no-pattern-match').length,
  skipped:records.filter(x=>x.status.startsWith('skipped')||x.status==='not-text').length,
  bytesRead:inspectedBytes,partial:limited||records.some(x=>x.status.startsWith('skipped'))};
 return {schema:'nathan-hall-of-mirrors.passive-inspection.v1',mode:'owner-selected-read-only',
  warning:'Heuristic findings are not proof of malware; no-pattern-match is not a clean bill of health.',
  networkOperations:0,filesModified:0,samplesExecuted:0,totals,records};
}
if(require.main===module){
 const args=process.argv.slice(2);
 if(args.length!==2||args[0]!=='--dir'){console.error('Usage: node inspector.cjs --dir /absolute/owner/selected/folder');process.exitCode=2;}
 else inspectLocal({dir:args[1]}).then(x=>process.stdout.write(JSON.stringify(x,null,2)+'\n')).catch(e=>{console.error('Inspection failed: '+e.message);process.exitCode=1});
}
module.exports={inspectLocal,options,SUPPORTED,MAX_FILES,MAX_DEPTH,MAX_BYTES,MAX_TOTAL_BYTES};
