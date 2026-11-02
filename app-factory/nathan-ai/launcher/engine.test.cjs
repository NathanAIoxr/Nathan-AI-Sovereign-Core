'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const api=require('./engine.js');
test('all destination IDs resolve to existing app entry points',()=>{
  assert.equal(new Set(api.destinations.map(d=>d.id)).size,api.destinations.length);
  for(const d of api.destinations){assert.ok(!/^[a-z]+:/i.test(d.path));assert.ok(fs.existsSync(path.resolve(__dirname,'..',d.path.split('#')[0])))}
  assert.equal(api.search('encrypted voice')[0].id,'voicebox');assert.equal(api.search('assistant')[0].id,'assistant');assert.equal(api.search('unfindable-token').length,0);
});
test('navigation preferences contain only known IDs, never query text',()=>{
  const p=api.preferences({favorites:['assistant','unknown','assistant'],recent:['runtime','unknown'],remember:true,query:'Private question'});
  assert.deepEqual(p,{favorites:['assistant'],recent:['runtime'],remember:true});assert.equal(p.query,undefined);
  assert.deepEqual(api.visit(api.defaults(),'assistant').recent,[]);
});
test('pins are bounded, reversible and recents require explicit opt-in',()=>{
  let p=api.favorite(api.defaults(),'assistant');assert.deepEqual(p.favorites,['assistant']);p=api.favorite(p,'assistant');assert.equal(p.favorites.length,0);
  p={...api.defaults(),remember:true};for(const d of api.destinations.slice(0,10))p=api.visit(p,d.id);assert.equal(p.recent.length,6);assert.equal(p.recent[0],api.destinations[9].id);
  assert.equal(api.preferences({...p,remember:false}).recent.length,0);
  let pins=api.defaults();for(const d of api.destinations.slice(0,12))pins=api.favorite(pins,d.id);assert.throws(()=>api.favorite(pins,api.destinations[12].id),/Maximum/);
});
test('one-source handoffs are bounded and preserve source stage and privacy',()=>{
  const source={id:'local:one',title:'Owner source',text:'Original words',stage:'Owner draft',private:true};const h=api.handoff('Explain this',source);assert.deepEqual(h.sources,[source]);assert.equal(h.schema,'nathan-ai.source-handoff.v1');
  assert.throws(()=>api.handoff('',source));assert.throws(()=>api.handoff('Explain',{...source,text:'x'.repeat(1201)}));
});
test('all Nathan AI entry pages share the same launcher',()=>{
  const base=path.resolve(__dirname,'..');let count=0;function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory()){if(p===path.join(base,'eyeprints-handprints'))continue;walk(p)}else if(e.name.endsWith('.html')){count++;assert.equal((fs.readFileSync(p,'utf8').match(/data-nathan-command-center/g)||[]).length,1,p)}}}walk(base);assert.ok(count>=28);
});
test('launcher never stores queries, executes plugins or embeds source text in URLs',()=>{
  const s=fs.readFileSync(path.join(__dirname,'app.js'),'utf8');assert.doesNotMatch(s,/innerHTML\s*=|localStorage\.clear\(|\beval\s*\(/);assert.match(s,/sessionStorage\.setItem\('nathan-ai\.source-handoff/);assert.match(s,/remember:false|remember:remember\.checked/);
});
