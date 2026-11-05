'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const E=require('./engine.js'),catalog=require('./catalog.json');
const atlas=path.resolve(__dirname,'../../../../one/five-matrix-atlas');
test('schema integrity, cross-reference IDs, five dimensions',()=>{const a=E.validate(catalog);assert.equal(a.schema,E.SCHEMA);assert.deepEqual(a.matrix.map(m=>m.id),E.MATRIX_IDS);assert.equal(new Set(a.records.map(x=>x.id)).size,a.records.length);for(const r of a.records)for(const link of r.links)assert.ok(a.records.some(x=>x.id===link),'Broken link '+r.id+' → '+link);});
test('preserves physical categories before conceptual gateways',()=>{const wardrobe=catalog.records.find(x=>x.id==='NAR-03'),gates=catalog.records.find(x=>x.id==='KJV-01'),symbol=catalog.records.find(x=>x.id==='SY-03');assert.equal(wardrobe.class,'furniture');assert.equal(gates.class,'gate');assert.equal(symbol.class,'symbolic transformation');});
test('all 12 wearable positions are unique and exactly 10 hand positions + 2 arm bracelets',()=>{const rings=catalog.rings;assert.equal(rings.length,12);assert.equal(new Set(rings.map(x=>x.position)).size,12);assert.equal(rings.filter(r=>r.position.includes('arm')).length,2);assert.equal(rings.filter(r=>!r.position.includes('arm')).length,10);assert.deepEqual(E.ringState(rings,new Set(rings.map(x=>x.id))),{selected:12,total:12,complete:true,hand:10,bracelets:2});});
test('keeps the five matrices separate from the seven-body model',()=>{assert.equal(catalog.matrix.length,5);const page=fs.readFileSync(path.resolve(__dirname,'index.html'),'utf8');assert.match(page,/Natural, Soul, Spirit, Shadow, Dead, Alive, Mind/);});
test('15 grounded quiz challenges have correct option and record reference',()=>{assert.equal(catalog.questions.length,15);for(const q of catalog.questions){assert.ok(catalog.records.some(x=>x.id===q.record));assert.equal(E.grade(q,q.answer).correct,true);for(const wrong of q.options.filter(o=>o!==q.answer))assert.equal(E.grade(q,wrong).correct,false);}});
test('15 original book outlines are not mislabeled as complete manuscripts',()=>{assert.equal(catalog.books.length,15);assert.equal(new Set(catalog.books.map(x=>x.id)).size,15);for(const book of catalog.books)assert.match(book.status,/not completed/);const text=E.bookDraft(catalog.books[0],'my original notes');assert.match(text,/my original notes/);assert.match(text,/not a completed novel/);});
test('atlas search respects universe, matrix, name and source classification',()=>{assert.ok(E.search(catalog,'wardrobe','Narnia').some(x=>x.id==='NAR-03'));assert.ok(E.search(catalog,'','KJV').every(x=>x.universe==='KJV'));assert.ok(E.search(catalog,'','','SHADOW').some(x=>x.id==='ME-01'));});
test('source-ledger originals exist and preserve two distinct, traceable source IDs',()=>{const a=JSON.parse(fs.readFileSync(path.join(atlas,'data/source-manifest.json'),'utf8'));const b=JSON.parse(fs.readFileSync(path.join(atlas,'data/line-index.json'),'utf8'));const c=JSON.parse(fs.readFileSync(path.join(atlas,'data/concordance.json'),'utf8'));assert.equal(a.source_count,2);assert.equal(b.records.length,499);assert.equal(c.distinct_terms,1471);assert.equal(c.total_occurrences,8286);for(const x of a.source_records)assert.ok(fs.existsSync(path.join(atlas,x.path)));});
test('integration leaves all seven existing Hop In lenses and original 104 feature concepts intact',()=>{const E0=require('../engine.js'),features=require('../features.json'),rootHtml=fs.readFileSync(path.resolve(__dirname,'../index.html'),'utf8');assert.equal(Object.keys(E0.MODE_LABELS).length,7);assert.equal(features.items.length,104);assert.match(rootHtml,/data-panel="five-matrix"/);assert.match(rootHtml,/five-matrix-frame/);assert.equal(E0.reply('/five').kind,'five-matrix');assert.ok(E0.reply('Show me the Arkenstone').links.some(l=>l.url.includes('five-matrix/')));});
test('source browser uses literal text nodes; it never evaluates imported transcript markup',()=>{const ui=fs.readFileSync(path.resolve(__dirname,'app.js'),'utf8');assert.match(ui,/textContent=text/);assert.doesNotMatch(ui,/\.innerHTML\s*=/);});

test('full original atlas baseline is exported unchanged for chatbox reuse',()=>{
 const original=fs.readFileSync(path.join(atlas,'NATHAN_AI_FIVE_MATRIX_SOVEREIGN_LAB.html'),'utf8');
 const key='window.ATLAS_DATA = ',at=original.indexOf(key)+key.length,end=original.indexOf(';\n',at);
 const embedded=JSON.parse(original.slice(at,end));
 const exported=JSON.parse(fs.readFileSync(path.join(atlas,'data/atlas-baseline-103.json'),'utf8'));
 assert.deepEqual(exported,embedded);
 assert.equal(exported.objects.length,103);assert.equal(exported.transformations.length,22);
 assert.equal(exported.scripture.length,20);assert.equal(exported.events.length,8);
 const categories=Object.fromEntries(exported.objects.map(x=>[x.id,x.category]));
 assert.equal(categories['narnia.wardrobe'],'furniture');
});
test('manifest source blobs match Git blob hashes of original source bytes',()=>{
 const crypto=require('node:crypto');
 const manifest=JSON.parse(fs.readFileSync(path.join(atlas,'data/source-manifest.json'),'utf8'));
 for(const source of manifest.source_records){
  const raw=fs.readFileSync(path.join(atlas,source.path));
  const gitObject=Buffer.concat([Buffer.from('blob '+raw.length+'\0'),raw]);
  assert.equal(crypto.createHash('sha1').update(gitObject).digest('hex'),source.blob_sha);
  assert.equal(raw.length,source.utf8_bytes);
 }
});
