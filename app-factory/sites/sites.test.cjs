
'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const dir = __dirname;
const factory = path.resolve(dir, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'sites.json'), 'utf8'));
const names = manifest.sites.map(s => s.id);
const expected = ['handling-life','christmas-toy-factory','santa-claus-factory','tabortales','tabor-world','you-sandbox','tabor-texting','find-the-tabor','words-library'];
const read = (p) => fs.readFileSync(p, 'utf8');
const locations = [...expected.map(id => path.join(dir, id, 'index.html')),path.join(dir, 'index.html')];
const allInRepo = p => fs.existsSync(p) && (fs.statSync(p).isFile() || fs.existsSync(path.join(p, 'index.html')));

function links(file) {
 const html = read(file);
 const attr = /(?:href|src)="([^"]+)"/gi;
 return [...html.matchAll(attr)].map(m => m[1]).filter(v => !v.startsWith('#') && !/^[a-z][a-z0-9+.-]*:/i.test(v));
}
function sourceData(html) {
 const m = html.match(/<script id="site-data" type="application\/json">([\s\S]*?)<\/script>/);
 assert.ok(m,'required static site data');
 return JSON.parse(m[1]);
}
test('nine original project identities have separate pages and nonduplicate IDs', () => {
 assert.deepEqual(names,expected);
 assert.equal(new Set(names).size,9);
 assert.equal(manifest.schema,'nathan-ai-independent-sites.v1');
 for(const id of names)assert.ok(allInRepo(path.join(dir,id)));
});
test('all new HTML pages are semantic, responsive and have valid local asset links', () => {
 for(const file of locations){
  const html=read(file);
  assert.match(html,/<!doctype html>/i);
  assert.match(html,/<html lang="en"/i);
  assert.match(html,/<meta name="viewport"/i);
  assert.match(html,/<main\b/i);
  assert.match(html,/<nav\b/i);
  assert.match(html,/<title>[^<]+<\/title>/i);
  for(const url of links(file)) {
   const stem=decodeURIComponent(url.split(/[?#]/)[0]);
   const target=path.resolve(path.dirname(file),stem);
   assert.ok(allInRepo(target),path.relative(factory,file)+' -> '+url);
  }
 }
});
test('independent sites show real local workspace controls, preserve exact source and prohibit remote intake',()=>{
 for(const id of expected){
  const html=read(path.join(dir,id,'index.html'));
  const data=sourceData(html);
  assert.equal(data.slug,id);
  assert.ok(data.title && data.identity && data.description);
  assert.ok(data.tracks.length>=3 && data.steps.length>=4);
  assert.equal(data.features.length,3);
  assert.match(html,/id="site-form"/);
  assert.match(html,/id="source-value"/);
  assert.match(html,/id="preview"/);
  for(const action of ['export-plan','copy-plan','restore-plan','print-plan','reset-plan'])assert.ok(html.includes('id="'+action+'"'),id+' '+action);
  assert.doesNotMatch(html,/<form[^>]*\saction=/i);
  assert.doesNotMatch(html,/<input[^>]+type="(?:password|email|tel)"/i);
  assert.doesNotMatch(html,/stripe\.com|paypal\.com|<iframe\b|<script[^>]*https?:/i);
 }
});
test('shared local browser scripts parse without installed packages and avoid external API submission',()=>{
 for(const f of ['site.js','portal.js','sites-data.js']){
  const source=read(path.join(dir,f));
  assert.doesNotThrow(()=>new vm.Script(source,{filename:f}));
  assert.doesNotMatch(source,/\beval\s*\(|new\s+Function\s*\(/);
 }
 const source=read(path.join(dir,'site.js'));
 assert.match(source,/Array\.from\(record\.original_text\)\.reverse\(\)/);
 assert.match(source,/JSON\.stringify\(record,null,2\)/);
 assert.match(source,/Blob\(/);
 assert.doesNotMatch(source,/fetch\(|XMLHttpRequest|navigator\.sendBeacon|localStorage/);
 assert.match(read(path.join(dir,'site.css')),/prefers-reduced-motion/);
 assert.match(read(path.join(dir,'portal.css')),/prefers-reduced-motion/);
});
test('new public routes are part of Nathan AI My Desktop with exact browser targets',()=>{
 const registry=read(path.join(factory,'nathan-ai/websites/registry.js'));
 const scope={window:{}};
 vm.runInNewContext(registry,scope);
 const rows=scope.window.NathanAIWebsiteModules;
 assert.ok(rows.length>=111,'must retain the 101 original routes plus 10 new network routes');
 const ids=new Set(rows.map(r=>r.id));
 assert.equal(ids.size,rows.length,'each public ID stays unique');
 for(const id of [...expected.map(s=>'sites/'+s+'/index.html'),'sites/index.html']){
  assert.ok(ids.has(id),'missing network route '+id);
 }
 for(const row of rows){
  assert.ok(row.title && typeof row.title==='string');
  const target=path.resolve(factory,row.id);
  assert.ok(allInRepo(target),'public page missing: '+row.id);
 }
 assert.match(read(path.join(factory,'nathan-ai/websites/index.html')),/sites\/handling-life/);
 assert.match(read(path.join(factory,'nathan-ai/websites/launchpad.html')),/Complete Website Network/);
});
test('Toy Drive and Toy Factory remain independently named and no live giving checkout is enabled',()=>{
 const toy=read(path.join(factory,'christmas-toy-drive/index.html'));
 const factoryPage=read(path.join(dir,'christmas-toy-factory/index.html'));
 assert.match(toy,/Christmas Toy Factory/);
 assert.match(toy,/Handling Life/);
 assert.match(factoryPage,/Factory makes the toy/);
 assert.match(factoryPage,/Toy Drive delivers donated gifts/);
 for(const html of [toy,factoryPage])assert.doesNotMatch(html,/stripe\.com|<iframe\b|paypal\.com/i);
});

test('the additional current games catalog is source-separated from playable public pages',()=>{
 const catalog=JSON.parse(read(path.join(factory,'nathan-ai/games/catalog.json')));
 assert.ok(catalog.entries.length>=84,'the current public catalog includes 84 title-stage records');
 assert.ok(catalog.entries.some(x=>x.stage==='private-prototype'));
 assert.ok(catalog.entries.some(x=>x.stage==='browser-demo'));
 const page=read(path.join(dir,'index.html'));
 assert.match(page,/id="load-games"/);
 assert.match(page,/data-type="game-catalog"/);
 const script=read(path.join(dir,'portal.js'));
 assert.match(script,/fetch\('\.\.\/nathan-ai\/games\/catalog\.json'/);
 assert.match(script,/entry\.stage!=='browser-demo'/);
});
