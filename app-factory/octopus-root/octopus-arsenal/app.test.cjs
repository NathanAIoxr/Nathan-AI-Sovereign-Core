'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const Game=require('./game.js'),Maths=require('../sovereign-continuum/engine.js'),Root=require('../engine.js');
const read=n=>fs.readFileSync(path.join(__dirname,n),'utf8');
test('all game weapons point to existing mathematical gates',()=>{
 const actual=new Set(Maths.GATES.map(g=>g.id));for(const w of Game.WEAPONS)assert.ok(actual.has(w.gate),w.id);
 assert.equal(Game.WEAPONS.length,8);assert.equal(Maths.GATES.length,25);assert.equal(Maths.DEEP_GATES.length,6);
});
test('HTML app contains accessible control surfaces for every active tab and all scripts',()=>{
 const h=read('index.html');for(const mode of ['arena','arsenal','laboratory','codex','workshop','root'])assert.ok(h.includes('id="view-'+mode+'"'));
 for(const name of ['../engine.js','../sovereign-continuum/engine.js','./game.js','./app.js','./app.css','./manifest.webmanifest'])assert.ok(h.includes(name),name);
 for(const id of ['arenaCanvas','waveStart','pauseButton','labSolve','graftRoot','exportSave','importSave','resetSave','quickWeapons'])assert.ok(h.includes('id="'+id+'"'),id);
});
test('manifest and service worker stay scoped to app and do not cache user files or other accounts',()=>{
 const m=JSON.parse(read('manifest.webmanifest')),sw=read('sw.js');
 assert.equal(m.scope,'./');assert.equal(m.display,'standalone');
 assert.ok(sw.includes("'../sovereign-continuum/engine.js'"));
 assert.ok(sw.includes("req.method!=='GET'"));
 assert.ok(!/analytics|pixel|stripe|paymentIntent|fetchAllAccounts|collectDeviceFingerprint/i.test(sw));
});
test('sample campaign and Root attach retain independent identifiers',()=>{
 const state=Game.create(3),root=Root.create();assert.ok(Game.start(state));
 const pack=Maths.graft(root,Root);assert.equal(pack.added,37);assert.equal(pack.attached,37);
 assert.ok(pack.state.nodes.some(n=>n.id==='continuum:gate-warp-wall'));
 assert.equal(root.nodes.length,Root.create().nodes.length);
});
test('search and code labels remain without third-party franchise branding',()=>{
 const publicText=read('index.html')+read('app.js')+read('app.css');
 for(const mark of ['lightsaber','jedi','kyber','neo','the matrix','star wars','repulsorlift','cookie monster'])assert.equal(publicText.toLowerCase().includes(mark),false,mark);
});
test('code uses only local script and stylesheet references, no CDN or live payment SDK',()=>{
 const h=read('index.html');assert.ok(!/<script[^>]+src="https?:/i.test(h));assert.ok(!/<link[^>]+href="https?:/i.test(h));
 assert.ok(read('app.js').includes('localStorage.setItem(ROOT_KEY'));
 assert.ok(read('app.js').includes('game.career'));
});
