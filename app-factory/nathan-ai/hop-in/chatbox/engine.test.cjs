'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const engine=require('./engine.js');const features=require('./features.json');const roots=require('./settings.json');
test('all seven modes retain their labels',()=>{assert.equal(Object.keys(engine.MODE_LABELS).length,7);assert.ok(engine.MODE_LABELS.theology.includes('God Lies'));});
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
test('D archive routes preserve exact source vs derived forms and existing modes',()=>{
  const direct=engine.reply('/d variants');
  assert.equal(direct.kind,'route');
  assert.ok(direct.links.some(x=>x.url==='../../../../archive-index/alphabet/d/index.html'));
  assert.ok(direct.links.some(x=>x.url.endsWith('canonical-d-sequences.json')));
  assert.match(direct.answer,/138 D\/d-starting/);
  assert.match(direct.answer,/14 The D titles/);
  assert.equal(engine.reply('show me D variants').links[0].url,'../../../../archive-index/alphabet/d/index.html');
  assert.match(engine.reply('/help').answer,/\/d /);
  assert.equal(Object.keys(engine.MODE_LABELS).length,7);
});
test('title caps length',()=>assert.ok(engine.messageTitle('X'.repeat(900)).length<=60));
test('root clear build module is reachable without changing existing modes',()=>{const result=engine.reply('/root');assert.equal(result.kind,'route');assert.ok(result.links.some(x=>x.url==='../root-clear/index.html'));assert.equal(engine.reply('/clear').kind,'route');assert.equal(engine.reply('/build').kind,'route');assert.equal(Object.keys(engine.MODE_LABELS).length,7);});

test('E source-family routes preserve original meaning distinctions',()=>{
 for(const q of ['/eloher','/ella','/evangelist','/eve','/eave']){
  const r=engine.reply(q);
  assert.equal(r.kind,'route');assert.ok(r.links.some(x=>x.url.includes('#e-word-families')));
 }
 assert.equal(engine.reply('/e geometry').kind,'route');
 assert.match(engine.reply('/evangelist').answer,/not good/);
 assert.ok(engine.reply("find the Eloher's").links[0].url.includes('#e-word-families'));
});

test('sup and casual hello work offline, without a model provider',()=>{
 for(const q of ['sup','SUP!','Sup?','sup...','yo','wassup','hey']){
  const out=engine.reply(q);
  assert.equal(out.kind,'greeting',q);
  assert.match(out.answer,/Sup bro!/);
  assert.match(out.answer,/Sup dude!/);
  assert.deepEqual(out.links,[]);
 }
 assert.notEqual(engine.reply('supernova').kind,'greeting');
 assert.notEqual(engine.reply('Tell me about the supremum paradox').kind,'greeting');
});
test('homepage is chat-first while tool panels remain accessible on demand',()=>{
 const fs=require('node:fs'),path=require('node:path');
 const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
 const css=fs.readFileSync(path.join(__dirname,'style.css'),'utf8');
 const app=fs.readFileSync(path.join(__dirname,'app.js'),'utf8');
 const simple=fs.readFileSync(path.join(__dirname,'simple-home.js'),'utf8');
 assert.match(html,/id="toggle-tools" aria-expanded="false"/);
 assert.match(html,/id="message"/);
 assert.match(html,/data-prompt="sup"/);
 assert.match(html,/src="simple-home.js"/);
 assert.ok(css.includes('.conversation .composer{order:-4'));
 assert.ok(css.includes('.shell:not(.advanced) .rail'));
 assert.ok(css.includes('.shell:not(.advanced) .tools'));
 assert.ok(simple.includes("shell.classList.toggle('advanced'"));
 assert.ok(app.includes("response.kind!=='greeting'"));
});

test('26-letter directory commands and source-preserving category routes',()=>{
 for(const q of ['/az','/alphabet','/categories','/apps','/games','/letter A','/letter Z']){const r=engine.reply(q);assert.equal(r.kind,'route');assert.ok(r.links.some(l=>l.url.includes('archive-index/alphabet/index.html')));}
 assert.equal(engine.reply('/letter B').links[0].url,'../../../../archive-index/alphabet/index.html?letter=B');
 assert.ok(engine.reply('browse all 26 letters').links.some(l=>l.url.endsWith('/alphabet/index.html')));
 assert.equal(engine.reply('/e').kind,'route');assert.equal(engine.reply('/d').kind,'route');
});

test('independent F archive, Nordic stick and Fabric routes preserve E/C/D and A-Z',()=>{
 for(const q of ['/f','/fabric','/f-runes','/f-geometry','/letter-f']){
  const result=engine.reply(q);assert.equal(result.kind,'route');assert.ok(result.links.some(x=>x.url.includes('archive-index/alphabet/f/laboratory/index.html')));
 }
 for(const q of ['fabric of the matrix','fehu rune','nordic stick language','F as P cut open']){
  const result=engine.reply(q);assert.equal(result.kind,'route');assert.ok(result.links.some(x=>x.url.includes('archive-index/alphabet/f/laboratory/index.html')));
 }
 assert.equal(engine.reply('/letter F').kind,'route');
 assert.equal(engine.reply('/e').kind,'route');
 assert.equal(engine.reply('/d').kind,'route');
 assert.equal(engine.reply('/az').kind,'route');
 assert.match(engine.reply('/f').answer,/64 publicly classified/);
});

test('G geometry / 5 / 6 / Tabor Spiral all source routes remain separate from E and F',()=>{
 for(const query of ['/g','/letter-g','/g-5','/g-6','/g-geometry','/g-spiral','/nautilus','/tabor-spiral']){
  const result=engine.reply(query);assert.equal(result.kind,'route',query);
  assert.ok(result.links.some(x=>x.url.includes('archive-index/alphabet/g/laboratory/index.html')),query);
 }
 for(const query of ['5 rotated around','6 reshaped','tabor spiral','nautilus','letter G','g geometry']){
  const result=engine.reply(query);assert.equal(result.kind,'route',query);
  assert.ok(result.links.some(x=>x.url.includes('archive-index/alphabet/g/laboratory/index.html')),query);
 }
 assert.equal(engine.reply('/letter G').kind,'route');
 for(const query of ['/f','/e','/d','/az'])assert.equal(engine.reply(query).kind,'route',query);
 assert.match(engine.reply('/g').answer,/713 public G title occurrences/);
});
