'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ROOT=path.resolve(__dirname,'../../..');
const atlas=path.join(__dirname,'index.html');
const pages=[
 atlas,
 path.join(__dirname,'../index.html'),
 path.join(__dirname,'../../index.html'),
 path.join(ROOT,'index.html')
];
const read=p=>fs.readFileSync(p,'utf8');
test('every UCT triple-code and parent page inline script parses',()=>{
 for(const p of pages){
  const html=read(p);
  const inline=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
   .filter(([,attrs])=>!/\bsrc\s*=/.test(attrs)).map(m=>m[2]).filter(s=>s.trim());
  assert.ok(inline.length>0,p+': no executable inline JavaScript');
  for(const [i,js] of inline.entries())assert.doesNotThrow(()=>new vm.Script(js,{filename:p+':inline-'+i}));
 }
});
test('atlas every local script, link and README resolves from its actual directory',()=>{
 const html=read(atlas),refs=[...html.matchAll(/(?:href|src)="([^"]+)"/g)].map(x=>x[1]);
 for(const href of refs){
  if(/^(https?:|mailto:|#)/.test(href))continue;
  assert.ok(fs.existsSync(path.resolve(path.dirname(atlas),href)), 'Missing: '+href);
 }
 for(const script of ['../../engine.js','../engine.js','../../../radix-ladder/engine.js','./engine.js'])
  assert.ok(html.includes('src="'+script+'"'), 'Missing runtime dependency: '+script);
});
test('Factory navigation, UCT source and parent Root all link directly to triple-code',()=>{
 const paths=[
  [path.join(ROOT,'index.html'),'./octopus-root/uct/triple-code/index.html'],
  [path.join(__dirname,'../../index.html'),'./uct/triple-code/index.html'],
  [path.join(__dirname,'../index.html'),'./triple-code/index.html']
 ];
 for(const [p,target] of paths)assert.ok(read(p).includes('href="'+target+'"'),p+': broken atlas link');
});
test('seven Egyptian numerals map to explicit Unicode signs with known codes',()=>{
 const T=require('./engine.js');
 const codepoints=['13068','13190','130ad','131bc','13362','13386','133fa'];
 assert.deepEqual(T.SIGNS.map(x=>x.glyph.codePointAt(0).toString(16)),codepoints);
 assert.deepEqual(T.SIGNS.map(x=>x.gardiner),['C11','I8','D50','M12','V1','V20','Z015']);
});
test('on-demand virtual codebook does not overwrite equation source or change namespaces',()=>{
 const T=require('./engine.js');
 const U=require('../engine.js');
 const first=U.build(),book=T.codebook();
 assert.deepEqual(book.claims,first.ledger);
 assert.deepEqual(book.records.map(x=>x.source.id),first.nodes.map(x=>x.id));
 assert.equal(book.records.length*3,420);
 assert.equal(book.links.length,148);
 assert.ok(book.records.every(x=>x.hieroglyphics.branchNote.includes('modern creative rule')));
});
