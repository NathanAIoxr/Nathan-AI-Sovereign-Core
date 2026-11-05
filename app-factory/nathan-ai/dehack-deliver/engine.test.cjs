'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const C=require('./catalog.js'),T=require('./engine.js');
test('26 letters, 104 original names, and the 101 heading discrepancy are retained',()=>{
 const r=C.validateRecords();
 assert.deepEqual(r,{letterGroups:26,sourceClaimedCount:101,actualSourceEntries:104,retainedEntries:104});
 assert.equal(C.records[0].title,'Absolute Asset Auditing');
 assert.equal(C.records[103].title,'Zodiac Alignment Synchronization');
 assert.equal(C.records.filter(x=>x.letter==='A').length,4);
 assert.equal(C.records.filter(x=>x.letter==='Z').length,4);
 assert.equal(new Set(C.records.map(x=>x.title)).size,104);
 assert.equal(C.FILTERS.length,3);
 assert.deepEqual(C.FILTERS.map(x=>x.title),[
  'Man-Made Lies Stripped (The Institutional Purge)',
  'Saint Jerome Lies Removed (The Textual & Translation Correction)',
  'God Lies Removed (The Spiritual Control Purge)'
 ]);
});
test('complete original-file import preserves every user-provided description byte-for-byte as text',()=>{
 const fixture=['The Consumer A-to-Z Reality Directory for Nathan AI 🚀','',
  'This is the ultimate, complete consumer directory mapping 101 physical, real-world actions, tools, and direct applications that a consumer can execute using the simple, unadorned interface of Nathan AI.',''];
 for(const l of C.LETTERS){
  fixture.push(l,'');
  C.records.filter(r=>r.letter===l).forEach(r=>fixture.push('• '+r.title+': Original description for '+r.title+' — Noël / 日本語'));
  fixture.push('');
 }
 fixture.push('The complete A-to-Z consumer registry is laid out on the workspace canvas.');
 const original=fixture.join('\n');
 const parsed=C.parseOriginal(original);
 assert.equal(parsed.length,104);
 assert.equal(parsed[2].description,'Original description for Binary Morality Filter — Noël / 日本語');
 assert.equal(parsed[2].verbatimLine,'• Binary Morality Filter: Original description for Binary Morality Filter — Noël / 日本語');
 assert.equal(C.records[2].description,'Source description available through verbatim original-file import');
 assert.equal(parsed[103].ordinal,104);
 const changed=original.replace('• Binary Morality Filter:', '• Binary Morality Filtre:');
 assert.throws(()=>C.parseOriginal(changed),/altered or moved/);
 assert.throws(()=>C.parseOriginal(original.replace('• Zero-State Slate Clearing:','Not a source:')),/104 original/);
});
test('catalog search and provenance do not invent specialized implementations',()=>{
 const truth=C.search(C.records,'realitist','R');assert.deepEqual(truth.map(x=>x.title),['Realitist Logic Filtering']);
 const tools=C.search(C.records,'dehacking','all');assert.equal(tools.length,0);
 const registered=C.records.filter(x=>x.workingMode==='worksheet');
 assert.ok(registered.length>60);
 assert.ok(C.records.filter(x=>x.workingMode!=='worksheet').length>8);
 assert.equal(C.SOURCE_SHA256,'1cf68a8d3c67d365f7e50717f91cbc4f49478d7fa0b9470e0874a432076177ff');
});
test('binary 1+1=10 and decimal 1+1=2 represent the identical quantity',()=>{
 const x=T.radixReview('1','1');
 assert.equal(x.decimal,'1 + 1 = 2');
 assert.equal(x.binary,'1₂ + 1₂ = 10₂');
 assert.equal(x.binaryValue,2);
 assert.equal(x.decimalValue,x.binaryValue);
 assert.equal(x.originalValueChanged,false);
 assert.throws(()=>T.radixReview('1.5','1'),/whole number/);
 assert.throws(()=>T.radixReview('-1','1'),/whole number/);
});
test('claims are not automatically labeled true, false, lies or institutional cover-ups',()=>{
 const r=T.evidenceReview('A source makes a historical claim','Manuscript A, page 3','Hypothesis to review');
 assert.equal(r.reviewState,'source-provided-awaiting-verification');
 assert.equal(r.automaticTruthOrLieVerdict,null);
 assert.equal(r.claim,'A source makes a historical claim');
 assert.equal(T.evidenceReview('Claim without evidence').reviewState,'source-required');
 assert.throws(()=>T.evidenceReview('   '),/required/);
});
test('Saint Jerome comparison preserves both original and later passages, listing only literal differences',()=>{
 const a='In principio erat Verbum.\nSecond source line';
 const b='In principio erat Verbum.\nDifferent translation line';
 const r=T.compareSources(a,b);
 assert.equal(r.differentLines,1);
 assert.deepEqual(r.changedLinePreview,[{line:2,original:'Second source line',comparison:'Different translation line'}]);
 assert.equal(r.original,a);
 assert.equal(r.comparison,b);
 assert.equal(r.autoAccusation,false);
 assert.throws(()=>T.compareSources('x\n'.repeat(402),''),/400 lines/);
});
test('plain-language preview never deletes or edits the original source',()=>{
 const text='Pursuant to the order, utilize the file in order to proceed.';
 const r=T.plainPreview(text);
 assert.equal(r.original,text);
 assert.equal(r.preview,'under the order, use the file to proceed.');
 assert.equal(r.originalModified,false);
 assert.equal(r.automaticTruthOrLieVerdict,null);
 assert.equal(r.suggestions.length,3);
});
test('20 percent resource-sharing calculation is reversible arithmetic, not an actual transfer',()=>{
 const r=T.share('10000','20');
 assert.equal(r.sharedCents,2000);
 assert.equal(r.remainderCents,8000);
 assert.equal(r.totalPreserved,true);
 assert.throws(()=>T.share('10000','110'),/0–100/);
 assert.equal(T.clearWorkspace().serverSessionsStopped,0);
 assert.equal(T.clearWorkspace().originalsModified,false);
});
test('consumer UI supports all 104 source selections, original import, export, clear and links to prior working MIDA',()=>{
 const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
 const app=fs.readFileSync(path.join(__dirname,'app.js'),'utf8');
 for(const id of ['originalFile','tools','runRadix','filterControls','runTool','exportResult','clearTool','exportSource']){
  assert.match(html,new RegExp('id="'+id+'"'));
 }
 assert.ok(html.indexOf('./catalog.js')<html.indexOf('./app.js'));
 assert.ok(html.indexOf('./engine.js')<html.indexOf('./app.js'));
 assert.match(html,/href="\.\.\/\.\.\/one\/sovereign-acro-matrix\//);
 assert.match(app,/C\.parseOriginal\(txt\)/);
 assert.match(app,/crypto\.subtle\.digest\('SHA-256',buffer\)/);
 assert.match(app,/T\.compareSources\(a,b\)/);
 assert.match(app,/T\.evidenceReview\(a,b,selection\.title\)/);
 assert.doesNotMatch(app,/innerHTML\s*=|eval\(|fetch\(|localStorage|navigator\.geolocation|XMLHttpRequest|WebSocket/);
});
