'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const f=require('./engine.js');
const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
const ui=fs.readFileSync(path.join(__dirname,'app.js'),'utf8');
const hub=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');

test('all six original preset families preserve author project names',()=>{
 assert.equal(f.SCHEMA,'nathan-ai.flyer.v1');
 assert.equal(f.PRESETS.length,6);
 assert.equal(new Set(f.PRESETS.map(p=>p.id)).size,6);
 assert.match(f.PRESETS.find(x=>x.id==='library').body,/33,000,000 planned book addresses/);
 assert.match(f.PRESETS.find(x=>x.id==='words').body,/LTR — RTL/);
 assert.match(f.PRESETS.find(x=>x.id==='trinity').body,/THE TABORIC LIGHT · THE LIGHT OF TABOR · THE TABOR LIGHT CIPHER/);
 assert.match(f.PRESETS.find(x=>x.id==='christmas').body,/No donations are collected/);
});

test('formats and color themes produce standalone native SVG',()=>{
 assert.equal(Object.keys(f.FORMATS).length,4);
 assert.equal(Object.keys(f.PALETTES).length,5);
 for(const [name,fmt]of Object.entries(f.FORMATS)){
   const d={...f.getPreset('nathan'),format:name};
   const svg=f.buildSVG(d);
   assert.match(svg,/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
   assert.ok(svg.includes('width="'+fmt.w+'" height="'+fmt.h+'"'));
   assert.match(svg,/<\/svg>$/);
   assert.ok(!/http:\/\/(?!www\.w3\.org)/.test(svg));
 }
});
test('text is XML escaped; no injected links or script nodes',()=>{
 const svg=f.buildSVG({...f.getPreset('nathan'),headline:'<script>alert("x")</script> & text',url:'"><image href="https://evil.test/"/>'});
 assert.ok(svg.includes('&lt;script&gt;'));
 assert.ok(!svg.includes('<script>'));
 assert.ok(!svg.includes('<image href='));
 assert.ok(svg.includes('&lt;image'));
});
test('design roundtrip preserves copy and safely validates schema and size',()=>{
 let d={...f.getPreset('words'),format:'landscape',palette:'parchment',headline:'Original words stay original'};
 const raw=f.exportJSON(d),back=f.importJSON(raw);
 assert.equal(back.headline,d.headline);
 assert.equal(back.format,'landscape');
 assert.equal(back.palette,'parchment');
 assert.throws(()=>f.importJSON('{"schema":"wrong","data":{}}'),/Not a NATHAN AI/);
 assert.throws(()=>f.importJSON('x'.repeat(30001)),/exceeds/);
 assert.equal(f.normalize({format:'__proto__'}).format,'portrait');
 assert.equal(f.normalize({palette:'constructor'}).palette,'sovereign');
});
test('no remote assets, subscriptions or fake QR codes; exports are user-initiated',()=>{
 assert.ok(html.includes('src="./engine.js"')&&html.includes('src="./app.js"'));
 assert.ok(!/<iframe\b|<img[^>]+src="https?:/i.test(html));
 assert.ok(!/<img[^>]+app-store/i.test(html));
 assert.ok(ui.includes("canvas.toBlob"));
 assert.ok(ui.includes("download(svgBlob()"));
 assert.ok(ui.includes("window.print()"));
 assert.ok(ui.includes('localStorage.setItem'));
 assert.ok(hub.includes('./flyer-studio/index.html'),'Main Hub must link the flyer tool');
});
