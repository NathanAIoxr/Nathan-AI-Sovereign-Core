/* NATHAN AI · SOVEREIGN DEFENDER
 * Owner-authorized antivirus-style triage, integrity comparison and inert
 * ransomware-behavior exercises. No active malware, file alteration,
 * quarantine, network scanning, credential access or retaliation.
 * Pure engine shared by the Node audit and local browser interface.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.NathanSovereignDefender=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const SCHEMA='nathan-ai.sovereign-defender.v1';
const EICAR_SHA256='275a021bbfb6489e54d471899f7db9d1663fc695ec2fe2a2c4538aabf651fd0f';
const ALLOWED_STATUS=new Set(['no-pattern-match','review-pattern','not-text','skipped-symlink','skipped-depth-limit','skipped-nonregular','skipped-file-type','skipped-size-limit','skipped-total-byte-limit','skipped-changed-file','browser-file']);
function assert(condition,message){if(!condition)throw Error(message)}
function validPath(p){return typeof p==='string'&&p.length>0&&p.length<1024&&!p.startsWith('/')&&!p.includes('\\')&&!p.includes('\0')&&p.split('/').every(segment=>segment&&segment!=='.'&&segment!=='..')}
function validSha(s){return typeof s==='string'&&/^[a-f0-9]{64}$/i.test(s)}
function normalize(entries){
 assert(Array.isArray(entries)&&entries.length<=2000,'Inspection data must be a bounded array');
 const found=new Set();
 return entries.map(e=>{
  assert(e&&validPath(e.path)&&!found.has(e.path),'Invalid, duplicate or unsafe original path');
  found.add(e.path);
  assert(ALLOWED_STATUS.has(e.status),'Invalid original file status');
  if(e.sha256!==undefined)assert(validSha(e.sha256),'Invalid file fingerprint');
  if(e.bytes!==undefined)assert(Number.isSafeInteger(e.bytes)&&e.bytes>=0,'Invalid file byte count');
  return {path:e.path,status:e.status,sha256:e.sha256||null,bytes:e.bytes??null,
    reasons:Array.isArray(e.reasons)?e.reasons.filter(x=>typeof x==='string').slice(0,16):[]};
 }).sort((a,b)=>a.path.localeCompare(b.path));
}
function audit(entries){
 const rows=normalize(entries);let findings=0,skipped=0;
 const files=rows.map(e=>{
  const indicators=[];
  const lower=e.path.toLowerCase();
  if(e.sha256?.toLowerCase()===EICAR_SHA256)indicators.push('EICAR-AV-Test — harmless standard test file');
  if(e.status==='review-pattern')indicators.push('Review suspicious text pattern (heuristic; not proof of malware)');
  if(/\.(?:locked|encrypted|crypt)$/i.test(lower))indicators.push('Ransomware-like file suffix (not conclusive)');
  if(/\.(?:pdf|docx|jpg|png|txt)\.(?:exe|scr|bat|cmd|js|vbs)$/i.test(lower))indicators.push('Double-extension filename (review)');
  if(e.status.startsWith('skipped')||e.status==='not-text')skipped++;
  if(indicators.length)findings++;
  return {...e,indicators,attention:indicators.length>0?'review':'no-indicator-observed'};
 });
 const partial=skipped>0;
 return {schema:SCHEMA,mode:'offline-read-only-triage',files,summary:{
  entries:files.length,withIndicators:findings,uninspected:skipped,
  coverage:partial?'partial':'examined-supported-files',
  malwareFreeCertified:false,actualProtectionInstalled:false},
  warning:'No indicator found is NOT proof a file is safe. This is a limited, passive prototype, not full antivirus.'};
}
function baselineFromReport(report){
 assert(report&&report.schema===SCHEMA&&Array.isArray(report.files),'Unrecognized source report');
 const files=report.files.filter(x=>validSha(x.sha256)&&validPath(x.path)).map(x=>({path:x.path,sha256:x.sha256.toLowerCase(),bytes:x.bytes})).sort((a,b)=>a.path.localeCompare(b.path));
 const paths=new Set(files.map(x=>x.path));assert(paths.size===files.length,'Duplicate source fingerprints');
 return {schema:'nathan-ai.sovereign-defender.baseline.v1',mode:'fingerprint-manifest-only',files,
  incomplete:(report.summary?.coverage!=='examined-supported-files'),
  caution:'Source hash manifest: not a substitute for isolated offline backup or verified restoration.'};
}
function verifyBaseline(baseline){
 assert(baseline?.schema==='nathan-ai.sovereign-defender.baseline.v1'&&Array.isArray(baseline.files)&&baseline.files.length<=2000,'Invalid baseline document');
 const seen=new Set();
 for(const f of baseline.files){
  assert(f&&validPath(f.path)&&validSha(f.sha256)&&!seen.has(f.path),'Invalid or duplicate baseline entry');
  seen.add(f.path);
  assert(f.bytes===null||(Number.isSafeInteger(f.bytes)&&f.bytes>=0),'Invalid baseline size');
 }
 assert(typeof baseline.incomplete==='boolean','Missing baseline coverage flag');
 return true;
}
function compareBaseline(baseline,report){
 verifyBaseline(baseline);
 assert(report?.schema===SCHEMA&&Array.isArray(report.files),'Invalid current scan');
 const before=new Map(baseline.files.map(f=>[f.path,f])),current=new Map();
 for(const f of report.files){assert(validPath(f.path)&&!current.has(f.path),'Invalid or duplicate current path');current.set(f.path,f)}
 const changed=[],added=[],missing=[],notVerified=[];
 for(const [p,f] of before){
  const now=current.get(p);
  if(!now){missing.push(p);continue}
  if(!validSha(now.sha256)){notVerified.push(p);continue}
  if(f.sha256.toLowerCase()!==now.sha256.toLowerCase())changed.push(p);
 }
 for(const [p,f] of current)if(!before.has(p)&&validSha(f.sha256))added.push(p);
 const isPartial=baseline.incomplete||report.summary?.coverage!=='examined-supported-files';
 return {schema:'nathan-ai.sovereign-defender.compare.v1',changed,added,missing,notVerified,
  status:isPartial?'inconclusive-partial-scan':'comparison-complete',
  warning:isPartial?'Partial source or current coverage means missing/changed results need manual verification.':'Fingerprints compare only observed bytes, not file safety.',
  originalsModified:false};
}
function syntheticRansomware(events){
 assert(Array.isArray(events)&&events.length<=1000,'Synthetic events must be a bounded array');
 const byPath=new Set(),accepted=[];
 for(const e of events){
  assert(e&&validPath(e.path)&&['rename','modify','backup-unavailable','restore'].includes(e.type),'Invalid synthetic event');
  const type=e.type;if(type==='rename')assert(validPath(e.to),'Invalid synthetic destination');
  accepted.push({type,path:e.path,to:e.to||null});
  byPath.add(e.path);
 }
 const renamed=accepted.filter(e=>e.type==='rename'&&/\.(?:locked|encrypted|crypt)$/i.test(e.to)).length;
 const modified=accepted.filter(e=>e.type==='modify').length;
 const missingBackup=accepted.some(e=>e.type==='backup-unavailable');
 const high=renamed>=3||(missingBackup&&(renamed>0||modified>=3));
 const warning=high?'Elevated synthetic ransomware-like activity':'No high-volume synthetic signal in this fixture';
 return {schema:'nathan-ai.sovereign-defender.exercise.v1',activity:{total:accepted.length,uniqueFiles:byPath.size,renamedWithSuspiciousSuffix:renamed,modified,backupUnavailable:missingBackup},
  alert:high?'mock-alert':'no-mock-alert',warning,filesChanged:0,filesEncrypted:0,networkCalls:0,
  note:'This exercise processes fictional event objects only. It never encrypts, deletes, renames or accesses real files.'};
}
function responseSteps(){
 return [
  'Preserve a factual incident timeline; do not execute or open suspicious files on your everyday computer.',
  'On systems you own, consult your security administrator or established response procedure to safely isolate affected devices.',
  'Verify backups are separate, offline or immutable; do not overwrite the last known-good original.',
  'Use trusted security tools and qualified responders for actual malware confirmation and eradication.',
  'Restore onto a verified clean system and check original file hashes; document outcomes and any applicable reporting duties.'
 ];
}
return Object.freeze({SCHEMA,EICAR_SHA256,validPath,validSha,normalize,audit,baselineFromReport,verifyBaseline,compareBaseline,syntheticRansomware,responseSteps});
});
