import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateF,selectF,selectFabric,selectRoutes,inspectGlyph,quizQuestions} from './f-core.mjs';
const read=name=>JSON.parse(readFileSync(new URL(name,import.meta.url),'utf8'));
const titles=read('./source-catalog-f.json'),fabric=read('./fabric-crosswalk.json'),routes=read('./structural-routes.json');
test('source, fabric and route JSON validate together',()=>assert.equal(validateF(titles,fabric,routes),true));
test('source 6056 row catalog includes only 64 F public occurrences',()=>{
 assert.equal(titles.master_rows,6056);assert.equal(titles.f_prefix_rows,69);
 assert.equal(titles.public_general_rows,64);assert.equal(titles.withheld_editorial_or_unknown_or_private,5);
 assert.equal(titles.entries.length,64);
});
test('duplicate original names retained as separate occurrences',()=>{
 const names=selectF(titles.entries,{query:'Fenrir'});
 assert.ok(names.length>=3);
 assert.equal(new Set(names.map(x=>x.catalog_row)).size,names.length);
});
test('150 Fabric references have six independent documented groups',()=>{
 assert.equal(fabric.entries.length,150);assert.equal(fabric.groups.length,6);
 assert.ok(selectFabric(fabric.entries,{query:'The Fabric of the World'}).length>=1);
 assert.ok(selectFabric(fabric.entries,{query:'The Fabric of Me Code'}).length>=1);
 assert.ok(selectFabric(fabric.entries,{query:'Harmonic Quilt'}).length>=1);
});
test('F as P cut open is creator-defined and original stick count not invented',()=>{
 assert.equal(routes.creator_exact,'F is also a P cut open');
 assert.equal(routes.geometry.F.straight_strokes,3);
 assert.equal(routes.geometry.F.original_sticks,null);
 assert.equal(routes.geometry.P.original_sticks,null);
 assert.equal(inspectGlyph('P',routes).record.description.includes('opens that bowl'),true);
});
test('runic Fehu, Perthro, Ogham Fearn and Latin F kept separate',()=>{
 for(const ch of ['F','P','ᚠ','ᛈ','ᚃ'])assert.ok(inspectGlyph(ch,routes).matched);
 assert.notEqual(inspectGlyph('ᚠ',routes).matched,inspectGlyph('ᚃ',routes).matched);
 assert.equal(inspectGlyph('ᚠ',routes).record.script,'Germanic runic');
 assert.equal(inspectGlyph('ᚃ',routes).record.script,'Irish Ogham');
 assert.equal(inspectGlyph('ᚠ',routes).historyClaim,false);
});
test('original Nordic and F code statements remain exact source strings',()=>{
 assert.ok(selectRoutes(routes.sourceRoutes,{query:'FL (Fluid Flow)'}).length===1);
 assert.ok(selectRoutes(routes.sourceRoutes,{query:'The Firewall'}).length===1);
 assert.ok(selectRoutes(routes.sourceRoutes,{query:'stick figure stretching'}).length>=1);
});
test('quiz has answer key and five independent questions',()=>{
 const q=quizQuestions();assert.equal(q.length,5);for(const x of q){assert.ok(x.answers.includes(x.correct));assert.equal(new Set(x.answers).size,4);}
});
