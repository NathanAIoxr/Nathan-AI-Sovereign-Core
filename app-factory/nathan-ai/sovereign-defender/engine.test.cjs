'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const D=require('./engine.js');
const shaA='a'.repeat(64),shaB='b'.repeat(64);
const input=[
 {path:'notes/project.txt',status:'no-pattern-match',sha256:shaA,bytes:20,reasons:[]},
 {path:'scripts/check.sh',status:'review-pattern',sha256:shaB,bytes:45,reasons:['remote-script-pipe']},
 {path:'unknown/backup.exe',status:'skipped-file-type'}
];
test('review-only threat triage preserves original facts without declaring an antivirus clearance',()=>{
 const report=D.audit(input);
 assert.equal(report.schema,D.SCHEMA);
 assert.equal(report.files.length,3);
 assert.equal(report.summary.withIndicators,1);
 assert.equal(report.summary.uninspected,1);
 assert.equal(report.summary.coverage,'partial');
 assert.equal(report.summary.malwareFreeCertified,false);
 assert.equal(report.summary.actualProtectionInstalled,false);
 assert.equal(report.files.find(x=>x.path==='scripts/check.sh').attention,'review');
 assert.deepEqual(input[1].reasons,['remote-script-pipe']);
});
test('EICAR test fingerprint is identified as harmless test, not a virus infection',()=>{
 const r=D.audit([{path:'test/eicar.txt',status:'browser-file',sha256:D.EICAR_SHA256,bytes:68}]);
 assert.equal(r.summary.withIndicators,1);
 assert.match(r.files[0].indicators[0],/harmless standard test file/);
 assert.equal(r.summary.malwareFreeCertified,false);
});
test('suspicious name indicators are informational and never destructive',()=>{
 const r=D.audit([
  {path:'work/doc.pdf.exe',status:'skipped-file-type'},
  {path:'work/project.txt.locked',status:'skipped-file-type'}
 ]);
 assert.equal(r.summary.withIndicators,2);
 assert.equal(r.summary.uninspected,2);
 assert.match(r.files[0].indicators.join(' '),/Double-extension/);
 assert.match(r.files[1].indicators.join(' '),/Ransomware-like/);
});
test('immutable baseline comparison distinguishes changed, missing and unverified files',()=>{
 const original=D.audit(input);
 const baseline=D.baselineFromReport(original);
 assert.equal(baseline.incomplete,true);
 const later=D.audit([
  {path:'notes/project.txt',status:'no-pattern-match',sha256:shaB,bytes:20},
  {path:'new/image.png',status:'browser-file',sha256:shaA,bytes:24},
  {path:'scripts/check.sh',status:'skipped-file-type'}
 ]);
 const c=D.compareBaseline(baseline,later);
 assert.deepEqual(c.changed,['notes/project.txt']);
 assert.deepEqual(c.added,['new/image.png']);
 assert.deepEqual(c.missing,[]);
 assert.deepEqual(c.notVerified,['scripts/check.sh']);
 assert.equal(c.status,'inconclusive-partial-scan');
 assert.equal(c.originalsModified,false);
 assert.equal(baseline.files[0].sha256,shaA);
});
test('complete baselines still distinguish absent files from remote access and malware claims',()=>{
 const before=D.audit([{path:'file.md',status:'no-pattern-match',sha256:shaA,bytes:5}]);
 const after=D.audit([{path:'other.md',status:'no-pattern-match',sha256:shaB,bytes:5}]);
 const c=D.compareBaseline(D.baselineFromReport(before),after);
 assert.deepEqual(c.missing,['file.md']);
 assert.deepEqual(c.added,['other.md']);
 assert.equal(c.status,'comparison-complete');
});
test('untrusted paths, repeated entries, forged fingerprints and baseline corruption fail closed',()=>{
 for(const p of ['../secret','/root/anything','a/../../secret','a\\secret','a//b','a/\0b','a/./b']){
  assert.equal(D.validPath(p),false,p);
 }
 assert.throws(()=>D.audit([{path:'a.txt',status:'browser-file',sha256:'BAD'}]),/fingerprint/);
 assert.throws(()=>D.audit([{path:'a.txt',status:'browser-file'}, {path:'a.txt',status:'browser-file'}]),/duplicate/);
 assert.throws(()=>D.audit([{path:'a.txt',status:'executed'}]),/status/);
 const bad={schema:'nathan-ai.sovereign-defender.baseline.v1',incomplete:false,files:[{path:'../evil',sha256:shaA,bytes:1}]};
 assert.throws(()=>D.verifyBaseline(bad),/Invalid or duplicate/);
});
test('ransomware simulation processes invented event objects only, never changes files',()=>{
 const events=[1,2,3,4].map(i=>({type:'rename',path:'demo/original-'+i+'.txt',to:'demo/original-'+i+'.txt.locked'}));
 const r=D.syntheticRansomware(events);
 assert.equal(r.alert,'mock-alert');
 assert.equal(r.activity.renamedWithSuspiciousSuffix,4);
 assert.equal(r.filesEncrypted,0);assert.equal(r.filesChanged,0);assert.equal(r.networkCalls,0);
 assert.equal(events[0].path,'demo/original-1.txt');
 const none=D.syntheticRansomware([{type:'modify',path:'demo/readme.md'}]);
 assert.equal(none.alert,'no-mock-alert');
 assert.throws(()=>D.syntheticRansomware([{type:'rename',path:'demo/ok',to:'../escape'}]),/destination/);
 assert.throws(()=>D.syntheticRansomware([{type:'execute',path:'demo/a'}]),/Invalid synthetic event/);
});
test('response plan prioritizes backups and human-reviewed restoration',()=>{
 const steps=D.responseSteps();
 assert.ok(steps.length>=5);
 assert.ok(steps.some(x=>/offline|immutable/.test(x)));
 assert.ok(steps.some(x=>/original file hashes/.test(x)));
 assert.ok(!steps.some(x=>/counter.?attack|disable security|encrypt files/i.test(x)));
});
