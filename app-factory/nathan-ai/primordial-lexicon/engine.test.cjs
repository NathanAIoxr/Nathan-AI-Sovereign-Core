'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const e=require('./engine.js'),source=require('./source-sequence.json'),audit=require('./resilience-source-audit.json');
const read=x=>fs.readFileSync(path.join(__dirname,x),'utf8');
const originals=['Primordial','Primortal','Priimortal','Primortial','Priimortial','Bimordial','Bimortal','Biimortal','Bimordial'];
test('source wording, order, duplicates and exact quote remain unchanged',()=>{
 assert.deepEqual(e.SOURCE,originals);
 assert.deepEqual(source.occurrences.map(x=>x.exactSpelling),originals);
 assert.deepEqual(e.sequence().map(x=>x.position),[1,2,3,4,5,6,7,8,9]);
 assert.equal(e.META.quote,source.quotation);
 assert.equal(e.types().length,8);
 assert.equal(e.types().find(x=>x.word==='Bimordial').count,2);
 assert.equal(source.occurrenceCount,9);
});
test('graph is deterministic and records only unique authored nodes',()=>{
 const g=e.graph(2),g2=e.graph(2);
 assert.deepEqual(g,g2);assert.equal(g.nodes.length,8);
 assert.equal(g.sourceOccurrences,9);assert.equal(g.distinctTerms,8);
 assert.equal(g.edges.some(x=>x.fromWord==='Primordial'&&x.toWord==='Primortial'),true);
 assert.equal(g.edges.some(x=>x.fromWord==='Primordial'&&x.toWord==='Bimordial'),true);
 assert.ok(g.edges.every(x=>x.source==='algorithmic-form-comparison'&&x.historicalClaim===false));
});
test('distance calculation reflects spelling changes and exact matches',()=>{
 assert.equal(e.editDistance('Primordial','Primordial'),0);
 assert.equal(e.editDistance('Primortal','Primortial'),1);
 assert.equal(e.editDistance('Primordial','Primortial'),1);
 assert.equal(e.editDistance('A','V'),1);
 assert.throws(()=>e.editDistance(null,'hi'),/Text required/);
 assert.throws(()=>e.graph(0),/1..5/);
});
test('machine suggestions never masquerade as additional owner-authored terms',()=>{
 const q=e.generatedVariants('Primordial');
 assert.equal(q.length,4);
 assert.equal(q.find(x=>x.operation==='Pr/B initial conversion').form,'Bimordial');
 assert.equal(q.find(x=>x.operation==='Pr/B initial conversion').authoredByUser,true);
 assert.equal(q.find(x=>x.operation==='Reversed spelling').attestedHistorical,false);
 assert.ok(q.every(x=>x.origin==='machine-generated suggestion'));
 assert.throws(()=>e.generatedVariants('Unwritten'),/documented original/);
});
test('reversal does not assert etymology or literal A-V equality',()=>{
 assert.equal(e.reverseForm('Primortal'),'latromirP');
 assert.ok(e.META.linguistic.includes('no established etymology'));
 const h=read('index.html');
 assert.match(h,/An upside-down A resembles ∀/);
 assert.match(h,/not<\/strong> newly attributed author words/);
});
test('two copies of the attached resilience catalog are de-duplicated and item 76 remains missing',()=>{
 assert.equal(audit.sourceFiles.length,2);
 assert.match(audit.sha256,/^[a-f0-9]{64}$/);
 assert.equal(audit.numberedScenarioStatus.actualUniqueIds,100);
 assert.deepEqual(audit.numberedScenarioStatus.missingIds,[76]);
 assert.equal(audit.categories.length,7);
 assert.equal(audit.categories.reduce((n,x)=>n+x.actualEntries,0),100);
 assert.match(audit.interpretation.verifiedEngineeringClaim,/still be stopped/);
});
test('browser is local-only, accessible and uses approved presentation libraries',()=>{
 const html=read('index.html'),js=read('app.js');
 assert.match(html,/connect-src 'none'/);
 assert.match(html,/data-nathan-command-center/);
 assert.match(html,/data-nathan-shared-appearance/);
 assert.match(html,/id="web"/);
 assert.match(html,/id="sourceSequence"/);
 assert.match(js,/textContent/);
 assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|WebSocket|eval\s*\(/);
});
