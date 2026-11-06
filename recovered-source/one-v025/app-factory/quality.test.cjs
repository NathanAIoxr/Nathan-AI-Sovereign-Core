'use strict';
/* Zero-dependency TABOR Factory public-repository integrity checks.
 * Run with: node --test app-factory/quality.test.cjs
 */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const factory=__dirname;
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(ent=>ent.isDirectory()?walk(path.join(dir,ent.name)):[path.join(dir,ent.name)])}
const sourceFiles=walk(factory);
const read=file=>fs.readFileSync(file,'utf8');

test('all public JavaScript files and HTML inline scripts have valid syntax',()=>{
 for(const file of sourceFiles){
  if(file.endsWith('.js'))assert.doesNotThrow(()=>new vm.Script(read(file),{filename:file}),file);
  if(!file.endsWith('.html'))continue;
  const page=read(file);
  for(const script of page.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)){
   if(/\bsrc\s*=/.test(script[1]))continue;
   if(/\btype\s*=\s*["']application\/(?:ld\+)?json["']/i.test(script[1])){JSON.parse(script[2]);continue}
   assert.doesNotThrow(()=>new vm.Script(script[2],{filename:file}),file);
  }
 }
});

test('no local app page contains a broken relative href or src',()=>{
 for(const file of sourceFiles.filter(x=>x.endsWith('.html'))){
  const html=read(file);
  for(const item of html.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi)){
   if(!item[1].startsWith('./')&&!item[1].startsWith('../'))continue;
   const rel=item[1].split(/[?#]/)[0];
   const target=path.resolve(path.dirname(file),rel);
   assert.ok(target.startsWith(root+path.sep)&&fs.existsSync(target),file+' points at missing '+item[1]);
  }
 }
});

test('ecosystem directory is unique, scoped and truthful',()=>{
 const data=JSON.parse(read(path.join(factory,'products.json')));
 assert.equal(data.schema,'tabor123.ecosystem-catalog.v1');
 /* Curated public catalog deliberately excludes unreleased private concepts. */
 assert.ok(data.products.length>=7);
 assert.equal(data.scope,'curated_public_registry_not_complete_private_portfolio');
 const ids=new Set();
 for(const p of data.products){
  assert.ok(!ids.has(p.id),'duplicate product: '+p.id);ids.add(p.id);
  assert.ok(['browser-demo','private-prototype','concept'].includes(p.status));
  assert.ok(typeof p.name==='string'&&p.name.trim().length>2);
  assert.ok(typeof p.docs==='string'&&p.docs.startsWith('./'));
  assert.ok(fs.existsSync(path.resolve(factory,p.docs)),p.name+' missing documentation');
  if(p.status==='browser-demo'){
   assert.ok(p.url&&p.url.startsWith('./'),p.name+' lacks demo');
   assert.ok(fs.existsSync(path.resolve(factory,p.url.split('#')[0])),p.name+' demo unavailable');
  }else{
   assert.equal(p.url,'',p.name+' must not advertise a nonpublic live demo');
  }
 }
});

test('unhashable Vault originals receive distinct fingerprints, never filename/size collision',async()=>{
 const source=read(path.join(factory,'vault.js'));
 const ids=['abc-original-1','abc-original-2','abc-original-3'];
 const sandbox={
  document:{addEventListener(){}},
  crypto:{randomUUID:()=>ids.shift()},
  console
 };
 vm.runInNewContext(source+'; globalThis.__vaultTest={fingerprintFor,digest};',sandbox,{filename:'vault.js'});
 const buffer=new ArrayBuffer(16);
 const one=await sandbox.__vaultTest.fingerprintFor('same-name.png',buffer,'same-origin');
 const two=await sandbox.__vaultTest.fingerprintFor('same-name.png',buffer,'same-origin');
 assert.equal(one.sha,null);
 assert.equal(two.sha,null);
 assert.notEqual(one.fingerprint,two.fingerprint);
 assert.ok(one.fingerprint.startsWith('unverified:'));
});

test('TABOR GPS reference math, hemisphere, and independent personal heading',()=>{
 const source=read(path.join(factory,'tabor-gps','gps.js'));
 const sandbox={};
 vm.runInNewContext(source,sandbox,{filename:'gps.js'});
 const g=sandbox.TaborGPSEngine;
 assert.ok(g);
 assert.equal(g.ecef(0,0).x,6378137);
 assert.ok(Math.abs(g.bearing({lat:0,lon:0},{lat:0,lon:10})-90)<0.001);
 assert.ok(g.haversine({lat:0,lon:179.9},{lat:0,lon:-179.9})<25000);
 assert.equal(g.poleward(20),'Geographic NORTH');
 assert.equal(g.poleward(-20),'Geographic SOUTH');
 assert.ok(g.relative(0,90).startsWith('RIGHT'));
 assert.equal(g.layerInfo().length,5);
 assert.equal(g.valid(91,0),false);
});

test('static offline cache does not intercept arbitrary API or user data',()=>{
 const sw=read(path.join(factory,'sw.js'));
 assert.match(sw,/URLS\.has\(url\.pathname\)/);
 assert.match(sw,/request\.headers\.has\('authorization'\)/);
 assert.match(sw,/url\.search/);
 assert.doesNotMatch(sw,/caches\.open\(CACHE\).*?put\(e\.request/s);
});

test('public Factory shell links to ecosystem and remains separate from ONE',()=>{
 const home=read(path.join(factory,'index.html'));
 assert.match(home,/href="\.\/ecosystem\.html"/);
 assert.match(home,/href="\.\/one\/index\.html"/);
 assert.match(home,/applyDeepLink/);
 assert.match(read(path.join(factory,'ecosystem.html')),/products\.json/);
});
