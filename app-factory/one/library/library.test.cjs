'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const page=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
const one=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=page.match(/<script>([\s\S]*?)<\/script>/)?.[1];
test('Master Library is embedded in actual ONE navigation',()=>{
 assert.match(one,/<button data-view="library">MASTER LIBRARY<\/button>/);
 assert.match(one,/<section data-page="library" hidden>/);
 assert.match(one,/src="\.\/library\/index\.html"/);
});
test('Library embeds nine 101–901 shelves separate from engineering divisions',()=>{
 assert.ok(script);
 assert.doesNotThrow(()=>new vm.Script(script));
 for(let i=1;i<=9;i++)assert.match(script,new RegExp("\\['"+i+"01'"));
 assert.match(page,/Library shelf numbers do not replace ONE's separate 101–901 engineering divisions/i);
 assert.match(page,/101–901 engineering divisions/i);
});
test('Local source preservation and private import are explicit',()=>{
 assert.match(script,/one\.library\.private-pack\.v1/);
 assert.match(script,/tabor\.faith-index\.v2/);
 assert.match(script,/Array\.isArray\(parsed\.source_records\)/);
 assert.match(script,/indexedDB\.open/);
 assert.match(script,/SHA-256/);
 assert.match(script,/original:raw/);
 assert.match(script,/blob:new Blob/);
 assert.match(script,/getAll\('records'\)/);
 assert.match(page,/not encrypted cloud storage/i);
 assert.match(page,/no private manuscripts/i);
 assert.doesNotMatch(script,/\bfetch\s*\(|\bXMLHttpRequest\b/);
});
test('Every output uses DOM text, not raw imported HTML execution',()=>{
 assert.match(script,/textContent=String\(text\)/);
 assert.doesNotMatch(script,/\.innerHTML\s*=/);
 assert.match(script,/Unsupported JSON structure/);
 assert.match(script,/60 \* 1024 \* 1024|60\*1024\*1024/);
 assert.match(script,/confirm\('Delete ALL locally imported/);
});
test('Original source bytes available independent of normalized index',()=>{
 assert.match(script,/createObjectStore\('sources'/);
 assert.match(script,/createObjectStore\('records'/);
 assert.match(script,/original:raw/);
 assert.match(script,/download\(s.name,s.blob\)/);
 assert.match(script,/Export searchable index/);
});
