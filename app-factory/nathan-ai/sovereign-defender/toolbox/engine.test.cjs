'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const T=require('./engine.js');
test('HTTPS link hygiene is explicitly non-certifying and offline',()=>{
 const r=T.reviewLink('https://example.org/a');
 assert.equal(r.host,'example.org');assert.equal(r.networkRequestMade,false);assert.equal(r.safeSiteCertified,false);
 assert.equal(r.reviewState,'no-listed-signals');
 assert.ok(T.reviewLink('http://user:pass@127.0.0.1:8080/file').flags.length>=3);
 assert.throws(()=>T.reviewLink('javascript:alert(1)'),/Only web/);
 assert.throws(()=>T.reviewLink('example.org'),/URL is not valid/);
});
test('permissions are owner-reported, not real changes',()=>{
 const a=T.reviewPermission({app:'Sample',permission:'administrator',scope:'always',reason:''});
 assert.equal(a.state,'review-needed');assert.equal(a.actualPermissionChanged,false);
 assert.equal(a.actualPermissionVerified,false);assert.ok(a.review.length>=2);
 assert.throws(()=>T.reviewPermission({app:'x',permission:'secrets',scope:'unknown'}),/Unsupported/);
});
test('backup checklist reports missing controls and never claims restored evidence',()=>{
 const a=T.reviewBackups({copies:1,media:1,offsite:false,offline:false,restoreTested:false,versioned:false,keyRecovery:false});
 assert.equal(a.missing.length,7);assert.equal(a.restoreIndependentlyVerified,false);
 const b=T.reviewBackups({copies:3,media:2,offsite:true,offline:true,restoreTested:true,versioned:true,keyRecovery:true});
 assert.equal(b.missing.length,0);assert.equal(b.state,'self-reported-checklist-complete');
 assert.throws(()=>T.reviewBackups({...b.answers,copies:-1}),/Invalid copy/);
});
test('timeline preserves chronological entry order and never edits device events',()=>{
 const input=[{observed:'2026-11-05T15:00',type:'noticed',details:'Observed warning on my machine'}];
 const copy=JSON.stringify(input);const a=T.incidentLog(input);
 assert.equal(a.count,1);assert.equal(JSON.stringify(input),copy);
 assert.equal(a.signed,false);assert.equal(a.remoteEventsChanged,0);
 assert.throws(()=>T.incidentLog([{...input[0],type:'delete-all'}]),/allowed/);
});
test('fingerprint comparison is bounded and does not certify safety',()=>{
 const sha='a'.repeat(64);const a=T.reviewFingerprint('owner-file.txt',sha,sha.toUpperCase());
 assert.equal(a.match,true);assert.equal(a.malwareFreeCertified,false);assert.equal(a.filesChanged,0);
 assert.equal(T.reviewFingerprint('owner-file.txt',sha,'b'.repeat(64)).match,false);
 assert.equal(T.reviewFingerprint('owner-file.txt',sha,'').match,null);
 assert.throws(()=>T.reviewFingerprint('x','broken',''),/valid SHA-256/);
});
test('browser source contains local interactive tools and links to original programs',()=>{
 const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
 const js=fs.readFileSync(path.join(__dirname,'app.js'),'utf8');
 for(const id of ['linkInput','runLink','runPerm','runBackup','runHash','addEvent','saveIncident','clearIncident','exportLast'])
  assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(html,/dehack-deliver/);assert.match(html,/hall-of-mirrors/);
 assert.doesNotMatch(js,/innerHTML\s*=|eval\s*\(|fetch\s*\(|XMLHttpRequest|WebSocket|localStorage/);
 assert.match(js,/crypto\.subtle\.digest\('SHA-256',buffer\)/);
});