/* NATHAN AI - DEFENSE / DEHACK TOOLBOX
 * Consent-first local analysis, never active endpoint defense or universal access.
 * Original Defender, Dehack / Deliver, Hall of Mirrors and 104 source titles
 * remain separate. This module writes no device files or remote resources.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.NathanDefenseToolbox=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const VERSION='nathan-ai.defense-toolbox.v1';
const PERMISSIONS=Object.freeze(['camera','microphone','contacts','precise-location','files','administrator','notifications','network']);
const EVENTS=Object.freeze(['noticed','triaged','isolated-by-owner','contacted-responder','backup-checked','restore-tested','resolved','note']);
function string(s,label,max){if(typeof s!=='string'||s.length>max)throw Error(label+' must be text of at most '+max+' characters');return s.trim()}
function reviewLink(input){
 const raw=string(input,'URL',2048);
 if(!raw)throw Error('Enter a URL');
 let url;try{url=new URL(raw)}catch{throw Error('URL is not valid; include http:// or https://')}
 if(!['http:','https:'].includes(url.protocol))throw Error('Only web URLs may be inspected');
 const host=url.hostname.toLowerCase(),flags=[];
 if(url.protocol!=='https:')flags.push('Unencrypted HTTP transport');
 if(url.username||url.password)flags.push('Embedded account information in URL');
 if(/(^|\.)xn--/.test(host))flags.push('Internationalized domain encoding: check the real organization carefully');
 if(/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)||host.startsWith('['))flags.push('Raw IP address instead of an ordinary domain name');
 if(host==='localhost'||host.endsWith('.local'))flags.push('Local network address, not a public website');
 if(url.port&& !['80','443'].includes(url.port))flags.push('Unusual explicit connection port');
 if(url.href.length>1000)flags.push('Very long URL: check for concealed redirects and unexpected parameters');
 return {schema:VERSION,tool:'link-hygiene',host,protocol:url.protocol,flags,reviewState:flags.length?'review-manually':'no-listed-signals',
  safeSiteCertified:false,networkRequestMade:false,notice:'This is an offline syntax review only. HTTPS and no warning flags do not establish that a website is safe.'};
}
function reviewPermission(data){
 if(!data||typeof data!=='object')throw Error('A permission record is required');
 const app=string(data.app,'Application name',120),reason=string(data.reason||'','Purpose',500),permission=string(data.permission,'Permission',40),scope=string(data.scope,'Scope',30);
 if(!app)throw Error('Application name is required');
 if(!PERMISSIONS.includes(permission))throw Error('Unsupported permission category');
 if(!['while-using','always','not-granted','unknown'].includes(scope))throw Error('Invalid permission scope');
 const sensitive=!['notifications','network'].includes(permission),review=[];
 if(scope==='unknown')review.push('Check current permission setting directly in your operating system');
 if(scope==='always'&&sensitive)review.push('Assess whether permanent access is necessary');
 if(!reason&&scope!=='not-granted')review.push('Write down why this application needs this access');
 if(permission==='administrator'&&scope!=='not-granted')review.push('Verify publisher and necessity before granting administrator rights');
 return {schema:VERSION,tool:'permission-register',app,permission,scope,reason,review,
  state:review.length?'review-needed':'owner-declared-recorded',actualPermissionChanged:false,actualPermissionVerified:false,
  notice:'The record is self-reported. No system permissions are read, granted, revoked, or certified by this page.'};
}
function reviewBackups(data){
 if(!data||typeof data!=='object')throw Error('Backup answers are required');
 const int=(v,label,max)=>{if(!Number.isSafeInteger(v)||v<0||v>max)throw Error('Invalid '+label);return v};
 const copies=int(data.copies,'copy count',100),media=int(data.media,'storage media count',100);
 const bools=['offsite','offline','restoreTested','versioned','keyRecovery'];
 for(const k of bools)if(typeof data[k]!=='boolean')throw Error('Invalid backup answer: '+k);
 const missing=[];
 if(copies<3)missing.push('Plan three independently recoverable copies, including the working original');
 if(media<2)missing.push('Use at least two suitable storage media or failure domains');
 if(!data.offsite)missing.push('Keep at least one copy in a separate physical or failure location');
 if(!data.offline)missing.push('Maintain an offline or immutable copy protected from ransomware');
 if(!data.restoreTested)missing.push('Perform an actual, authorized test restoration onto a clean target');
 if(!data.versioned)missing.push('Consider version history or recovery points');
 if(!data.keyRecovery)missing.push('Document safe access to recovery keys, without entering secrets here');
 return {schema:VERSION,tool:'backup-readiness',answers:{copies,media,...Object.fromEntries(bools.map(k=>[k,data[k]]))},
  completedControls:7-missing.length,controlsChecked:7,missing,selfReported:true,restoreIndependentlyVerified:false,
  state:missing.length?'improvements-recommended':'self-reported-checklist-complete',
  notice:'A checklist is not evidence that a backup restores. Never upload encryption keys or sensitive backup material.'};
}
function incidentLog(rows){
 if(!Array.isArray(rows)||rows.length>100)throw Error('Maximum 100 incident entries per local session');
 const records=rows.map((r,i)=>{
  if(!r||typeof r!=='object')throw Error('Invalid incident entry');
  const observed=string(r.observed,'Observed local time',40),details=string(r.details,'Incident details',1000),type=string(r.type,'Event type',40);
  if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(observed))throw Error('Use a local date and time in YYYY-MM-DDTHH:mm format');
  if(!EVENTS.includes(type)||!details)throw Error('Each incident entry requires an allowed event type and factual details');
  return {ordinal:i+1,observedLocal:observed,type,details};
 });
 return {schema:VERSION,tool:'incident-ledger',records,count:records.length,originalLogEdited:false,remoteEventsChanged:0,
  signed:false,notice:'Owner-entered observations, not independently authenticated events. Export a copy and preserve external evidence separately.'};
}
function reviewFingerprint(name,sha,previous){
 const file=string(name,'File name',255),fingerprint=string(sha,'SHA-256',64).toLowerCase(),baseline=string(previous||'','Previous SHA-256',64).toLowerCase();
 if(!file||!/^[0-9a-f]{64}$/.test(fingerprint)||(baseline&&!/^[0-9a-f]{64}$/.test(baseline)))throw Error('A file name and valid SHA-256 hexadecimal hashes are required');
 return {schema:VERSION,tool:'integrity-compare',file,sha256:fingerprint,baseline:baseline||null,match:baseline?baseline===fingerprint:null,
  filesChanged:0,malwareFreeCertified:false,notice:'A matching hash indicates identical observed bytes, not a clean file or trustworthy baseline.'};
}
return Object.freeze({VERSION,PERMISSIONS,EVENTS,reviewLink,reviewPermission,reviewBackups,incidentLog,reviewFingerprint});
});