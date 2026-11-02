'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const g=require('./geometry.js');
const ui=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
const app=fs.readFileSync(path.join(__dirname,'app.js'),'utf8');
const hub=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const directory=fs.readFileSync(path.join(__dirname,'..','hub.js'),'utf8');
test('original hooked-cross declaration and scripture indexes are source-first',()=>{
 assert.match(g.SYMBOL,/The swastika a\.k\.a\. THE HOOKED CROSS/);
 assert.match(g.SYMBOL,/Holy Fools and Divine Jesters/);
 assert.match(g.SYMBOL,/they have a job$/);
 assert.deepEqual(g.SCRIPTURE,['James 1:27','Romans 13:4','James 2:26','Ephesians 5:11','Isaiah 58:1','Titus 3:10']);
});
test('precise thirteen-point radial geometric separation and four-arm phases',()=>{
 assert.equal(g.STAGES.length,5);
 assert.equal(g.angle(1,13),360/13);
 assert.equal(g.angle(13,13),360);
 const p=g.pt(0,13,100);
 assert.ok(Math.abs(p[0])<1e-10&&Math.abs(p[1]+100)<1e-10);
 assert.throws(()=>g.angle(1,0),/Invalid fold count/);
 for(const stage of g.STAGES){
  const s=g.buildSVG({stage:stage.id,spin:0,size:1200,guides:true});
  assert.match(s,/^<svg /);
  assert.match(s,/<\/svg>$/);
  assert.ok(s.includes('13 × 27.69230769°'));
  assert.ok(s.includes('width="1200" height="1200"'));
 }
 assert.equal((g.buildSVG({stage:'thirteen'}).match(/translate\(0 -132\)/g)||[]).length,13);
});
test('wheel concepts preserve two/four distinction and no invented literal engineering test',()=>{
 assert.match(g.wheelsSVG(2),/TWO WHEELS/);
 assert.match(g.wheelsSVG(4),/FOUR WHEELS/);
 assert.equal((g.wheelsSVG(2).match(/stroke-width="12"/g)||[]).length,2);
 assert.equal((g.wheelsSVG(4).match(/stroke-width="12"/g)||[]).length,4);
 assert.throws(()=>g.wheelsSVG(3),/2 or 4 wheels/);
});
test('public browser app links are additive, and private source stays out of GitHub',()=>{
 assert.ok(hub.includes('./innocence-matrix/index.html'));
 assert.ok(directory.includes('../nathan-ai/innocence-matrix/index.html'));
 assert.ok(ui.includes('id="novel-pack"')&&ui.includes('id="art-file"'));
 assert.ok(app.includes("obj.schema!=='nathan-ai.innocence.owner-pack.v1'"));
 assert.match(app,/source_sha256/);
 assert.ok(app.includes('.py')&&app.includes('download-source'));
 assert.ok(!app.includes('localStorage')&&!app.includes('indexedDB')&&!app.includes('sessionStorage'));
 assert.doesNotMatch(ui+app+g.buildSVG({stage:'cross'}),/17\.5-year family estrangement|Independent Fundamental Baptist Preacher.s Wife|physically in heaven cannot passively author/i);
});
test('no remote image loading, covert user-file upload or execution of imported Python',()=>{
 assert.doesNotMatch(ui,/<img[^>]+src="https?:/i);
 assert.doesNotMatch(app,/fetch\(|XMLHttpRequest|WebSocket|eval\(|new Function\(/);
 assert.ok(app.includes('file.text()')||app.includes('f.text()'));
 assert.ok(app.includes('new Blob'));
 assert.doesNotThrow(()=>new (require('node:vm').Script)(app));
 assert.equal(g.esc('<img src="x">&'), '&lt;img src=&quot;x&quot;&gt;&amp;');
});