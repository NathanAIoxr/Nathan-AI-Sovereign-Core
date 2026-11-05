'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const C=require('./engine.js');
const products=JSON.parse(fs.readFileSync(path.join(__dirname,'products.json'),'utf8'));
const regions=JSON.parse(fs.readFileSync(path.join(__dirname,'jurisdictions.json'),'utf8'));

test('all consumer product records are distinct and point to real checked-in HTML source',()=>{
 const summary=C.verifyProducts(products);
 assert.equal(summary.products,12);
 assert.equal(new Set(products.products.map(p=>p.id)).size,products.products.length);
 assert.deepEqual(C.categories(products).sort(),[
  'Books & knowledge','Creative learning','Creator workbench','Home & discovery','Private storage','Safety & research','Sensitive personal tools'
 ].sort());
 for(const p of products.products){
  const target=path.resolve(__dirname,p.href);
  assert.equal(fs.existsSync(target),true,p.href);
  assert.ok(target.endsWith('.html'),p.id);
  assert.ok(p.limits.every(x=>x.length>=12));
 }
});
test('unsupported, remote, unsafe, absolute and script URLs cannot be launched by the consumer registry',()=>{
 for(const bad of ['https://example.com/a.html','javascript:alert(1)','../../../../etc/index.html',
                   '../../one/../../../secret/index.html','/absolute/index.html','../evil/%2e%2e/index.html',
                   '../bad\\index.html','../thing/index.html?token=private','//remote.example/index.html',
                   '../../one/../../private/index.html','../../one/foo/evil.html']){
  assert.equal(C.safeLocalHref(bad),false,bad);
 }
 assert.equal(C.safeLocalHref('../five-guardians/index.html'),true);
 assert.equal(C.safeLocalHref('../../one/offloader/index.html'),true);
 const copied=structuredClone(products);copied.products[0].href='https://evil.invalid/collect';
 assert.throws(()=>C.verifyProducts(copied),/Unsafe/);
 const duplicate=structuredClone(products);duplicate.products[1].id=duplicate.products[0].id;
 assert.throws(()=>C.verifyProducts(duplicate),/duplicate/);
});
test('search and category/stage filters accurately reflect consumer jobs without exposing hidden source',()=>{
 const backups=C.filterProducts(products,{query:'backup'});
 assert.ok(backups.some(x=>x.id==='offloader'));
 assert.ok(!backups.some(x=>x.id==='six-dogs'));
 const security=C.filterProducts(products,{category:'Safety & research'});
 assert.deepEqual(security.map(p=>p.id).sort(),['guardians','hall']);
 assert.ok(security.every(p=>p.stage==='developer-preview'));
 const sensitive=C.filterProducts(products,{stage:'owner-local-browser'});
 assert.ok(sensitive.some(p=>p.id==='health'));
 assert.equal(C.filterProducts(products,{query:'does-not-exist'}).length,0);
});
test('all region entries use reviewed official HTTPS sources and eight evidence gates',()=>{
 const summary=C.verifyJurisdictions(regions);
 assert.equal(summary.jurisdictions,12);
 assert.equal(summary.gates,8);
 for(const reg of regions.jurisdictions){
  assert.ok(reg.checks.length>=2,reg.id);
  assert.ok(reg.sources.length>=1);
  assert.ok(reg.sources.every(x=>new URL(x.url).protocol==='https:'));
 }
 const c=structuredClone(regions);c.jurisdictions[0].sources[0].url='https://evil.invalid/help';
 assert.throws(()=>C.verifyJurisdictions(c),/unofficial/);
 const broken=structuredClone(regions);broken.releaseGates[1].id=broken.releaseGates[0].id;
 assert.throws(()=>C.verifyJurisdictions(broken),/Invalid release gate/);
});
test('region selection is manually assigned and unknown or empty picks fall back to other',()=>{
 assert.equal(C.regionById(regions,'eu-eea').id,'eu-eea');
 assert.equal(C.regionById(regions,'us-ca').id,'us-ca');
 assert.equal(C.regionById(regions,'').id,'other');
 assert.equal(C.regionById(regions,'not-a-region').id,'other');
});
test('all consumer products present limitations and no universal compliance certificate is ever generated',()=>{
 for(const p of products.products){
  const warns=C.productDisclaimers(p);
  assert.ok(warns.length>=3);
  assert.ok(warns.every(x=>typeof x==='string'&&x.length>15));
 }
 const gates=C.releaseChecklist(regions);
 assert.equal(gates.length,8);
 assert.ok(gates.every(g=>g.status==='needs-owner-and-qualified-review'));
 assert.ok(!gates.some(g=>g.status==='certified'||g.status==='complete'));
 assert.match(products.releaseLevel,/not-production-certification/);
 assert.match(regions.status,/not legal opinion/);
});
test('original creator-worldview sentence is quoted, but cannot replace scientific geography or jurisdiction',()=>{
 assert.equal(regions.conceptualVocabulary.creatorExactWords,
  'globally is the world = round and internationally is the earth = flat .. per the bible and all ancient texts');
 assert.match(regions.conceptualVocabulary.category,/Creator-attributed artistic/);
 assert.match(regions.conceptualVocabulary.clarification,/oblate spheroid/);
 assert.match(regions.conceptualVocabulary.clarification,/not indicate alternative Earth shapes/);
});
test('consumer UI is responsive, uses shared launcher/appearance and avoids tracking/unsafe HTML injection',()=>{
 const ui=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
 const app=fs.readFileSync(path.join(__dirname,'app.js'),'utf8');
 assert.match(ui,/<html lang="en">/);
 assert.match(ui,/name="viewport"/);
 assert.match(ui,/data-nathan-shared-appearance/);
 assert.match(ui,/data-nathan-command-center/);
 assert.match(ui,/for="query"/);
 assert.match(ui,/for="region"/);
 assert.match(ui,/prefers-reduced-motion/);
 assert.match(ui,/No invented 100%/);
 for(const s of ['products.json','jurisdictions.json','textContent','replaceChildren','reviewed the limitations']){
  assert.match(app,new RegExp(s.replace('.','\\.')));
 }
 assert.doesNotMatch(app,/\b(?:navigator\.geolocation|localStorage\.setItem|document\.cookie|innerHTML\s*=|eval\s*\()/);
 assert.doesNotMatch(ui,/https?:\/\/(?:google-analytics|googletagmanager|facebook\.com\/tr)/);
 assert.ok(fs.existsSync(path.join(__dirname,'manifest.webmanifest')));
});
