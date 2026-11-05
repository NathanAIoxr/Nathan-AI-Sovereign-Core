'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const here=__dirname;
const manifest=JSON.parse(fs.readFileSync(path.join(here,'assets/visual-registry.json'),'utf8'));
const read=rel=>fs.readFileSync(path.join(here,rel),'utf8');
const order=['KNICK','KNACK','PADDY','WHACK','DOG','BONE'];

test('all 12 locally hosted vector assets are present and accessible',()=>{
 assert.equal(manifest.assets.length,12);
 assert.equal(new Set(manifest.assets.map(a=>a.file)).size,12);
 for(const asset of manifest.assets){
   const svg=read(asset.file);
   assert.match(svg,/^<svg /,asset.file);
   assert.match(svg,/<title\b/,asset.file);
   assert.match(svg,/\bviewBox="/,asset.file);
   assert.doesNotMatch(svg,/<script|<foreignObject|<iframe|onload\s*=|onclick\s*=/i,asset.file);
   assert.doesNotMatch(svg,/(?:https?:)?\/\/|<image\b|@import|url\((?:['"]?)(?:https?:)?\/\//i,asset.file);
   assert.ok(Buffer.byteLength(svg,'utf8')<25000,asset.file);
 }
});
test('all six dog emblems have separate assets and exact original order',()=>{
 assert.deepEqual(manifest.stageOrder,order);
 const cards=manifest.assets.filter(a=>a.role==='character');
 assert.equal(cards.length,6);
 assert.deepEqual(cards.map(x=>x.identity),order);
 assert.deepEqual(cards.map(x=>x.stage),[1,2,3,4,5,6]);
 assert.equal(new Set(cards.map(a=>a.accent)).size,6);
 for(const card of cards)assert.match(read(card.file),new RegExp(card.identity));
});
test('Six Dogs browser page actually uses the visual assets and skin',()=>{
 const html=read('index.html');
 assert.match(html,/class="sovereign-prism"/);
 assert.match(html,/href="skin\.css"/);
 assert.match(html,/assets\/hero-prism\.svg/);
 for(const asset of manifest.assets)assert.ok(html.includes(asset.file)||
   (asset.role==='character'&&read('app.js').includes(asset.file)),asset.file+' not wired to page');
 assert.match(html,/connect-src 'none'/);
});
test('stage buttons render each image as decorative without replacing accessible names',()=>{
 const script=read('app.js');
 assert.match(script,/artwork\.alt=""/);
 assert.match(script,/setAttribute\("aria-label"/);
 assert.match(script,/CARD_ART\[s.index\]/);
 assert.match(script,/aria-current/);
});
test('global appearance adds a thirteenth theme and keeps the originals',()=>{
 const appearance=require('../appearance/engine.js');
 assert.equal(appearance.skins.length,13);
 assert.equal(appearance.skins.find(x=>x.id==='sovereign-prism').name,'Sovereign Prism');
 assert.equal(appearance.skins.filter(x=>x.id==='original').length,1);
});
test('no external images, embedded faces or unverified deployment claims in media registry',()=>{
 assert.deepEqual(manifest.boundaries.some(x=>/no human/i.test(x)),true);
 for(const asset of manifest.assets)assert.ok(!/^https?:/i.test(asset.file));
 assert.doesNotMatch(read('index.html'),/<img[^>]+src="https?:/i);
 const html=read('index.html');
 assert.match(html,/not a live distributed deployment|not a real peer-to-peer cluster/);
});
