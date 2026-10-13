'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const dir=__dirname;
const original=JSON.parse(fs.readFileSync(path.join(dir,'registry.json'),'utf8'));
const added=JSON.parse(fs.readFileSync(path.join(dir,'morning-additions-238.json'),'utf8'));
const source=[...added.items,...original.items];
test('all six morning game archives total 376 reference positions',()=>{
 assert.equal(added.schema,'tabor123.morning-additions.v1');
 assert.equal(added.count,238);
 assert.equal(added.items.length,238);
 assert.equal(original.total_reference_positions,138);
 assert.equal(original.items.length,138);
 assert.equal(source.length,376);
 assert.equal(new Set(source.map(r=>r.id)).size,376);
});
test('original eight game families and source order remain separate',()=>{
 const families=[
 ['execution and combat',34],
 ['nurturing mind-craft',33],
 ['off-the-wall master strokes',33],
 ['historical and modern card games',69],
 ['historical and modern board games',69],
 ['nurturing interactive sandboxes',35],
 ['conceptual master strokes',34],
 ['autonomous simulation',34],
 ['void and nothingness',35]
 ];
 let offset=0;for(const [family,size] of families){assert.ok(source.slice(offset,offset+size).every(r=>r.family===family),family);offset+=size;}
 assert.equal(offset,376);
});
test('source-specific identity and intentional duplicate Doom are preserved',()=>{
 assert.equal(source.filter(x=>x.title==='Doom'&&x.family==='execution and combat').length,2);
 assert.equal(source.filter(x=>x.family==='historical and modern card games').filter(x=>/^NT-CARD-\d{3}$/.test(x.id)).length,69);
 assert.equal(source.filter(x=>x.family==='historical and modern board games').filter(x=>/^T123-BOARD-069-B\d{3}$/.test(x.id)).length,69);
 assert.ok(source.every(x=>!/^TW-\d{3}$/.test(x.id)),'TW original games must never be overwritten');
});
test('sanitized public references exclude owner private links or provider credentials',()=>{
 const text=JSON.stringify([original,added]);
 for(const s of [/mail\.google\.com/i,/ACUX6DNDpOptar/i,/-----BEGIN PRIVATE KEY-----/])assert.ok(!s.test(text));
 assert.ok(source.every(x=>typeof x.source_description==='string'&&x.source_description.length>15));
});
test('unified Explorer fetches both archival registries',()=>{
 const html=fs.readFileSync(path.join(dir,'all-morning.html'),'utf8');
 assert.match(html,/\.\/morning-additions-238\.json/);
 assert.match(html,/\.\/registry\.json/);
 assert.match(html,/brief/);
 assert.match(html,/376/);
});