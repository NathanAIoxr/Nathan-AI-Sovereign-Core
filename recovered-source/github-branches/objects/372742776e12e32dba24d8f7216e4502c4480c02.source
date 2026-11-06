'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const engine=require('./engine.js');const features=require('./features.json');const roots=require('./settings.json');
test('all eight modes retain their labels',()=>{assert.equal(Object.keys(engine.MODE_LABELS).length,8);assert.ok(engine.MODE_LABELS.theology.includes('God Lies'));});
test('A–Z lists precisely 104 unique original titles',()=>{const rows=engine.validateCatalog(features,'consumer-feature-catalog.v1');assert.equal(rows.length,104);assert.equal(new Set(rows.map(x=>x.title)).size,104);for(const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ')assert.equal(rows.filter(x=>x.letter===letter).length,4)});
test('only the 43 actually enumerated settings appear',()=>{const rows=engine.validateCatalog(roots,'root-settings-excerpt.v1');assert.equal(rows.length,43);assert.ok(rows.some(x=>x.title==='Addition Mode (1+1=2)'));});
test('directory filtering accepts A–Z and complete search',()=>{const rows=engine.validateCatalog(features,'consumer-feature-catalog.v1');assert.equal(engine.catalogSearch(rows,'','A',100).length,4);assert.ok(engine.catalogSearch(rows,'calendar').some(x=>/calendar/i.test(x.title+' '+x.sourceDescription)));});
test('status of inventions not silently promoted to shipped',()=>{assert.ok(features.items.every(x=>x.stage==='concept'));assert.ok(engine.reply('/features').answer.includes('104'));});
test('group assembly is source research not alleged historical quotes',()=>{const row=engine.assembly('justice',['jesus','mlkjr']);assert.match(row.answer,/research perspectives/);assert.match(row.answer,/not actual historical speech/);assert.ok(!row.answer.includes('Jesus says:'));});
test('unrecognized group members are not instantiated',()=>{assert.match(engine.assembly('test',['imaginary-id']).answer,/Select one or more/)});
test('modes change framing without asserting automatic truth purge',()=>{const row=engine.reply('Can you verify a historical claim?',{mode:'institution'});assert.match(row.answer,/Do not pre-judge/);});
test('text remains literal in local response',()=>{const q='<script>alert(1)</script>';assert.doesNotThrow(()=>engine.reply(q));});
test('save validation rejects incorrect JSON and impossible turns',()=>{assert.throws(()=>engine.validateSession({schema:'bad',turns:[]}));assert.throws(()=>engine.validateSession({schema:engine.SCHEMA,turns:[{role:'root',text:'abc',kind:'user'}]}));});
test('credential detection rejects literal secret assignments',()=>{assert.throws(()=>engine.reply('password: hunter2'));assert.throws(()=>engine.validateSession({schema:engine.SCHEMA,turns:[{role:'user',text:'api_key=private',kind:'user'}]}))});
test('source instructions are never executed from catalog',()=>{assert.equal(engine.reply('/sources').kind,'sources');assert.ok(engine.reply('/sources').answer.includes('configured local adapter'));});
test('a hidden /reset command cannot clear state',()=>{assert.equal(engine.reply('/reset').kind,'reset-request');assert.match(engine.reply('/reset').answer,/visible CLEAR/)});
test('links are bundled known destinations',()=>{for(const l of Object.values(engine.LINKS))assert.ok(l.url.startsWith('../')||l.url.startsWith('https://'));});
test('title caps length',()=>assert.ok(engine.messageTitle('X'.repeat(900)).length<=60));
test('Snow Family mode preserves exact required order and points to original-source register',()=>{
 assert.match(engine.MODE_LABELS.snow,/Snow Family/);
 const r=engine.reply('Show the 19 levels and the equator',{mode:'snow'});
 assert.equal(r.kind,'original-sources');
 assert.ok(r.answer.includes('+9, +8, +7, +6, +5, +4, +3, +2, +1'));
 assert.ok(r.answer.includes('−9, −8, −7, −6, −5, −4, −3, −2, −1'));
 assert.ok(r.links.some(l=>l.url.includes('original-words/snow-family/index.html')));
});
test('Snow mode is additive; original chat modes remain supported',()=>{
 for(const mode of ['core','modern','institution','theology','jerome','custom','assembly','snow'])assert.ok(engine.MODE_LABELS[mode]);
});
const fs=require('node:fs');const path=require('node:path');
test('original Snow excerpts and chat mode button are present',()=>{
 const base=path.resolve(__dirname,'../../original-words/snow-family');
 const doc=JSON.parse(fs.readFileSync(path.join(base,'excerpts.json'),'utf8'));
 assert.equal(doc.records.length,20);
 assert.ok(doc.records.some(x=>x.original_exact.includes('left to Wright and then right to left')));
 const page=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
 assert.ok(page.includes('data-mode="snow"'));
});
