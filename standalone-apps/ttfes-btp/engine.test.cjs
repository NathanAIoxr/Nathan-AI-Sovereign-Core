'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const C=require('./catalog.js'),E=require('./engine.js');
const dec=new TextDecoder();
function zipEntries(bytes){
 const out={},b=Buffer.from(bytes);let offset=0;
 while(offset+30<=b.length&&b.readUInt32LE(offset)===0x04034b50){
   assert.equal(b.readUInt16LE(offset+8),0,'stored ZIP entries only');
   const len=b.readUInt16LE(offset+26),ext=b.readUInt16LE(offset+28);
   const size=b.readUInt32LE(offset+18),name=b.subarray(offset+30,offset+30+len).toString('utf8');
   const start=offset+30+len+ext;
   assert.equal(out[name],undefined,'No duplicate archive paths');
   out[name]=b.subarray(start,start+size);
   offset=start+size;
 }
 return out;
}
test('entire standalone registry covers all required workflow families',()=>{
 const r=C.validate();assert.equal(r.ok,true,r.errors.join('\n'));
 assert.equal(r.count,133);assert.equal(r.sectors,22);
 for(const name of ['kickstarter','kdp','shopify','etsy','gumroad','lemon-squeezy','substack','ghost',
   'upwork','fiverr','linkedin-jobs','behance','adobe-portfolio','shutterstock','adobe-stock',
   'meta-ads','pinterest','youtube','airbnb','vrbo','zillow','apartments','opensea','magic-eden',
   'gitcoin','mirror','canvas','blackboard','grants-gov','sam-gov',
   'github','vercel','one-library','evidence','app-store','play-console',
   'foia','regulations','sba','research-gov','era-commons']){
     assert.ok(C.lookup(name),name);
 }
 assert.ok(C.SECTORS.includes('Government & grants'));
 assert.ok(C.SECTORS.includes('Civic & public records'));
});
test('government fields are meaningful and sensitive attestations remain human-only',()=>{
 const t=C.lookup('grants-gov');const keys=t.fields.map(f=>f.key);
 for(const k of ['proposal','objectives','budget_justification','eligibility','outcomes','certification'])assert.ok(keys.includes(k),k);
 assert.equal(t.workflow,'restricted');
 assert.throws(()=>E.createDraft({source:'original',destinationId:'sam-gov',fields:{tax_info:'123-45-6789'}}),/directly on the official/);
 assert.throws(()=>E.createDraft({source:'original',destinationId:'grants-gov',fields:{certification:'I attest'}}),/directly on the official/);
});
test('original text is kept verbatim and derivatives remain separate',()=>{
 const source=' \tSVIRS ≠ VIRUS\r\n☀️\n1+1=2\n1-1=0 ';
 const d=E.createDraft({source,destinationId:'one-library',fields:{title:'Derived title',body:'New summary'},utc:'2026-11-06T21:00:00Z'});
 assert.equal(d.source.text,source);
 assert.equal(d.fields.body,'New summary');
 assert.equal(d.source.preservedExactlyAsSupplied,true);
 assert.equal(d.destination.submitted,false);
 assert.equal(d.destination.published,false);
 assert.equal(d.review.ownerApproved,false);
});
test('logical field types are validated on each of 133 destinations',()=>{
 for(const t of C.TARGETS){
   const fields={};
   for(const f of t.fields)if(!['certification','tax_info','account_info','residency'].includes(f.key))fields[f.key]='Example '+f.key;
   const draft=E.createDraft({destinationId:t.id,source:'SOURCE UNCHANGED\n',fields});
   assert.equal(draft.fieldMeta.length,t.fields.length,t.id);
   assert.equal(Object.keys(draft.fields).length,t.fields.length,t.id);
   assert.equal(draft.destination.id,t.id);
   assert.equal(draft.source.text,'SOURCE UNCHANGED\n');
   assert.equal(draft.destination.providerAuthorized,false);
 }
});
test('CSV is BOM-tagged, quoted, and hardened against formula injection',()=>{
 const draft=E.createDraft({source:'Original',destinationId:'shopify',fields:{
   title:'=HYPERLINK("https://invalid.example")',body:'-1+1',
   sku:'@SUM(A1:A3)',seo_title:'+CMD'
 }});
 const csv=E.mappingCsv(draft);
 assert.ok(csv.startsWith('\uFEFF'));
 assert.match(csv,/"'=HYPERLINK/);
 assert.match(csv,/"'-1\+1"/);
 assert.match(csv,/"'@SUM/);
 assert.match(csv,/"'\+CMD"/);
 assert.match(csv,/provider_selector_verified/);
});
test('ZIP path traversal, duplicate entries and oversize source are blocked',()=>{
 assert.throws(()=>E.makeZip([{path:'../leak',text:'a'}]),/Unsafe/);
 assert.throws(()=>E.makeZip([{path:'a.txt',text:'1'},{path:'a.txt',text:'2'}]),/Duplicate/);
 assert.throws(()=>E.createDraft({source:'x'.repeat(11*1024*1024),destinationId:'kickstarter'}),/limit/);
 assert.throws(()=>E.batchDrafts('source',[{id:'kickstarter'},{id:'kickstarter'}]),/Duplicate target/);
});
test('ChatGPT payload prompt has original boundaries and does not invent platform support',()=>{
 const source='Original voice: Yes is Yes — No is No.';
 const prompt=E.makePrompt('grants-gov',source);
 assert.ok(prompt.includes(source));
 assert.match(prompt,/BEGIN ORIGINAL SOURCE/);
 assert.match(prompt,/Never invent legal rights, government eligibility/);
 assert.match(prompt,/no assumptions/i);
});
test('UTF-8 fingerprint is deterministic and equals SHA-256',async()=>{
 const value='Tabor — 1+1=2\n';
 const result=await E.sha256(new TextEncoder().encode(value));
 assert.equal(result,crypto.createHash('sha256').update(value).digest('hex'));
});
test('complete 133-target source-preserving ZIP: all destinations, original file bytes, assets, consent',async()=>{
 const original='ORIGINAL\r\nSource UTF-8 — no rewriting';
 const byteSource=new TextEncoder().encode(original);
 const targets=C.TARGETS.map(x=>({id:x.id,fields:{title:'Example title for '+x.name}}));
 const result=await E.buildPackage({
   source:original,originalBytes:byteSource,creator:'Nathan Tabor',projectTitle:'Full Spectrum',
   reference:'User supplied original',targets,
   review:{rightsReviewed:true,claimsReviewed:true,governmentAware:true},
   assets:[{name:'cover draft.txt',bytes:new TextEncoder().encode('ARTWORK ORIGINAL')}]
 });
 assert.equal(result.drafts.length,133);
 const files=zipEntries(result.bytes);
 assert.equal(dec.decode(files['SOURCE/original-text.txt']),original);
 assert.equal(dec.decode(files['SOURCE/original-file-bytes.bin']),original);
 assert.equal(dec.decode(files['ASSETS/cover_draft.txt']),'ARTWORK ORIGINAL');
 assert.equal(Object.keys(files).filter(x=>x.endsWith('draft.json')).length,133);
 const manifest=JSON.parse(dec.decode(files['MANIFEST/receipt.json']));
 assert.equal(manifest.destinations.length,133);
 assert.equal(manifest.originalFileSha256,crypto.createHash('sha256').update(byteSource).digest('hex'));
 assert.equal(manifest.sourceTextSha256,manifest.originalFileSha256);
 assert.equal(manifest.ownerSelfReview.rightsReviewed,true);
 assert.equal(manifest.ownerSelfReview.externallyValidated,false);
 assert.equal(manifest.providerWrite,false);
 assert.equal(manifest.published,false);
 assert.match(dec.decode(files['README-FIRST.txt']),/NOT CERTIFIED PROVIDER IMPORT SCHEMAS/);
});
test('user workspace imports safely and refuses unknown destination field combinations',()=>{
 const source='Some verbatim original';
 const restored=E.validateWorkspace({schema:E.VERSION,source,projectTitle:'Book',
   targets:[{id:'kdp',fields:{title:'Book title'}},{id:'grants-gov',fields:{proposal:'Research'}}]});
 assert.equal(restored.source,source);
 assert.equal(restored.targets.length,2);
 assert.throws(()=>E.validateWorkspace({schema:'other',source,targets:[]}),/Unsupported/);
 assert.throws(()=>E.validateWorkspace({schema:E.VERSION,source,targets:[{id:'kdp',fields:{password:'secret'}}]}),/Unsupported field/);
});
test('browser app and MV3 extension do not embed remote posting or stored credentials',()=>{
 const base=__dirname,app=fs.readFileSync(path.join(base,'app.js'),'utf8');
 const popup=fs.readFileSync(path.join(base,'extension','popup.js'),'utf8');
 const manifest=JSON.parse(fs.readFileSync(path.join(base,'extension','manifest.json'),'utf8'));
 const html=fs.readFileSync(path.join(base,'index.html'),'utf8');
 assert.deepEqual(manifest.permissions,['activeTab','scripting']);
 assert.equal(manifest.background,undefined);
 assert.equal(manifest.host_permissions,undefined);
 assert.match(html,/original-source/);
 assert.match(html,/target-list/);
 assert.match(html,/export-batch/);
 assert.doesNotMatch(app,/\blocalStorage\b|\bfetch\s*\(|\bXMLHttpRequest\b|sendBeacon/);
 assert.doesNotMatch(popup,/\blocalStorage\b|\bfetch\s*\(|\bXMLHttpRequest\b|sendBeacon|\.submit\s*\(/);
});
