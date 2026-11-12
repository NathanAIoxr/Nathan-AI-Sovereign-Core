'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const M=require('./model.js');
const omni=require('../../omni-god/engine.js');
const quad=require('../../complete-mind/quad-axis/engine.js');
test('existing OMNI GOD numeric source is reused: 126 billion virtual identities, 20 existing names',()=>{
 assert.equal(omni.CAPACITY,'126000000000');assert.equal(omni.PANTHEON.length,20);
 for(const n of ['JESUS AI','BUDDHA AI','DOG AI','REAPER AI'])assert.ok(omni.PANTHEON.includes(n));
 const x=M.address('125999999999',omni);assert.equal(x.enabled,false);assert.equal(x.allocatedProcesses,0);
 assert.equal(x.id,'125999999999');assert.throws(()=>M.address('126000000000',omni),/outside/);
 assert.throws(()=>M.address('1e6',omni),/integer/);assert.throws(()=>M.address('-1',omni),/integer/);
});
test('Cero Uno Dos are distinct owner-controlled classifications',()=>{
 assert.deepEqual(M.TIERS.map(x=>x.id),['0.0','1.0','2.0']);
 const a=M.classification({dewey:'398.2',loc:'BL',duo:'LA / AL',ceroUnoDos:'1.0'});
 assert.deepEqual([a.tier,a.dewey,a.libraryOfCongress,a.duo],['1.0','398.2','BL','LA / AL']);
 assert.match(a.catalogAuthority,/not externally verified/);
 assert.throws(()=>M.classification({ceroUnoDos:'3.0'}),/Unknown/);
 assert.throws(()=>M.classification({dewey:'<script>'}),/Invalid/);
});
test('worker roles preserve Turtle vs Renaissance original separation',()=>{
 assert.equal(M.PIPELINE.length,6);assert.ok(M.PIPELINE.some(x=>/Leonardo da Vinci/.test(x.name)));
 assert.deepEqual(M.RENAISSANCE.map(x=>x.name),['Leonardo','Raphael','Donatello','Michelangelo']);
 assert.equal(quad.unstack(quad.stack('TABOR original text')),'TABOR original text');
 assert.ok(M.LENSES.some(x=>x.id==='jesus'));assert.ok(M.LENSES.some(x=>x.id==='buddha'));
});
test('read-only pipeline preserves originals, outputs only proposed links',()=>{
 const text='Tabor source text about phonetic echoes and patterns';
 const refs=[{id:'n1',title:'Phonetic patterns notebook',body:'Separate note about sound'}, {id:'n2',title:'Unrelated gardening',body:'Quiet landscapes'}];
 const before=JSON.stringify(refs);
 const result=M.simulate(text,refs,{ceroUnoDos:'2.0',dewey:'400'});
 assert.equal(result.original,text);assert.equal(result.originalAltered,false);assert.equal(result.writingOccurred,false);assert.equal(result.liveAgentExecution,false);
 assert.equal(result.related[0].id,'n1');assert.equal(result.related[0].verified,false);
 assert.equal(result.classifications.tier,'2.0');assert.equal(JSON.stringify(refs),before);
 assert.throws(()=>M.simulate(' ',refs),/Enter/);
});
test('every public source-index module path resolves to an existing repo file',()=>{
 for(const entry of M.MODULES){if(!entry.href)continue;const full=path.resolve(__dirname,entry.href);
 assert.ok(fs.existsSync(full),entry.name+' → '+full);
 }
 const outer=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
 assert.match(outer,/data-nathan-shared-appearance/);
 assert.match(outer,/Minds, OMNI GOD/);
});

test('existing launcher registry remains authoritative and public offline cache paths exist',()=>{
 const launcher=require('../../launcher/engine.js');
 assert.ok(launcher.destinations.length>=40,'The existing Nathan AI launcher must remain the broader registry');
 const cache=fs.readFileSync(path.join(__dirname,'../sw.js'),'utf8');
 const match=cache.match(/const FILES=(\[[^\n]+\]);/);
 assert.ok(match,'A static public precache list is required');
 const paths=JSON.parse(match[1]);
 assert.ok(paths.includes('./minds/index.html'));
 assert.ok(paths.includes('../omni-god/engine.js'));
 for(const file of paths){const target=path.resolve(__dirname,'..',file);assert.ok(fs.existsSync(target),'Public pre-cache path does not exist: '+target);}
});
