'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const lib=require('./search-core.js');
const pub=JSON.parse(fs.readFileSync(path.join(__dirname,'publication.json'),'utf8'));

test('multilingual public search ignores Latin accents but never changes original source',()=>{
 const original=[{title:'Noël — Original voice',language:'français',content:'日本語 עברית Māori'},
  {title:'The English Work',language:'English',content:'Preserve the original'}];
 assert.equal(lib.search(original,'noel')[0],original[0]);
 assert.equal(lib.search(original,'FRANÇAIS')[0],original[0]);
 assert.equal(lib.search(original,'日本語')[0],original[0]);
 assert.equal(lib.search(original,'עברית')[0],original[0]);
 assert.equal(lib.search(original,'maori')[0],original[0]);
 assert.equal(lib.search(original,'the english')[0],original[1]);
 assert.deepEqual(lib.search(original,'none'),[]);
 assert.equal(lib.search(original,'').length,2);
 assert.equal(original[0].title,'Noël — Original voice');
 assert.equal(original[0].content,'日本語 עברית Māori');
});
test('cached index search preserves source object identity and filter semantics',()=>{
 const rows=[{title:'First',language:'English',content:'A long source'},
  {title:'Second',language:'French',content:'Another long source'},
  {title:'Third',language:'Spanish',content:'A third source'}];
 assert.equal(lib.search(rows,'source').length,3);
 assert.deepEqual(lib.search(rows,'french'),[rows[1]]);
 assert.equal(lib.search(rows,'French')[0],rows[1]);
 assert.equal(lib.search(rows,'engliSh')[0],rows[0]);
 assert.throws(()=>lib.search({},'a'),/array/);
});
test('source publication downloads are restricted to fixed archive paths and consistent metadata',()=>{
 assert.ok(pub.downloads.length>=6);
 for(const item of pub.downloads){
  assert.equal(lib.safeDownload(item),true,item.file);
  const target=path.resolve(__dirname,item.file);
  assert.ok(target.startsWith(path.resolve(__dirname,item.file.startsWith('books/')?'books':'downloads')+path.sep));
  assert.ok(fs.statSync(target).isFile(),item.file);
  assert.equal(fs.statSync(target).size,item.bytes,'Original archive size metadata mismatch: '+item.file);
  const actual=crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex');
  assert.equal(actual,item.sha256,'Original archive checksum differs from publication manifest: '+item.file);
 }
});
test('untrusted URL schemes, path traversal and malformed download metadata are refused',()=>{
 const base={bytes:11,sha256:'a'.repeat(64)};
 for(const file of ['../private.zip','downloads/../../private.zip','https://example.org/private.zip',
                    '//example.org/evil.zip','downloads/file.svg','downloads/bad%2fpath.zip',
                    'downloads\\hacked.zip','downloads/.hidden.zip','downloads/..evil.zip',
                    'downloads/file.zip?token=x','javascript:alert(1)']){
  assert.equal(lib.safeDownload({...base,file}),false,file);
 }
 assert.equal(lib.safeDownload({...base,file:'downloads/valid.zip',sha256:'ab'}),false);
 assert.equal(lib.safeDownload({...base,file:'downloads/valid.zip',bytes:NaN}),false);
 assert.equal(lib.safeDownload({...base,file:'downloads/valid.zip'}),true);
});
test('Library Mind page loads verified search before app and reader supports keyboard return',()=>{
 const page=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
 const app=fs.readFileSync(path.join(__dirname,'app.js'),'utf8');
 assert.ok(page.indexOf('<script src="search-core.js">')<page.indexOf('<script src="app.js">'));
 assert.match(page,/aria-labelledby="title"/);
 assert.match(page,/prefers-reduced-motion/);
 assert.match(app,/S\.search\(rows,\$\('search'\)\.value\)/);
 assert.match(app,/S\.safeDownload\(r\)/);
 assert.match(app,/lastOpener\.focus\(\)/);
 assert.match(app,/event\.key==='Escape'/);
 assert.doesNotMatch(app,/\binnerHTML\s*=/);
});
