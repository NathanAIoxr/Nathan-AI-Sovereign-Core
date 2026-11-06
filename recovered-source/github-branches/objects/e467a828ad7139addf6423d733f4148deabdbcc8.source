'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const api=require('./engine.js');
test('twelve distinct skins preserve readable text, muted labels and primary actions',()=>{
  assert.equal(api.skins.length,12);assert.equal(new Set(api.skins.map(s=>s.id)).size,12);
  for(const skin of api.skins){for(const [a,b]of [[skin.text,skin.panel],[skin.muted,skin.panel],[skin.accent,skin.panel],[skin.onAccent,skin.accent]])assert.ok(api.contrast(a,b)>=4.5,skin.id+' contrast '+a+'/'+b)}
});
test('appearance settings round trip independently of app content',()=>{
  const value={skin:'parchment',font:'serif',scale:'1.2',density:'compact',width:'reading',reduceMotion:true};assert.deepEqual(api.parse(api.serialize(value)),value);
  const clean=api.settings({...value,nodes:[{private:true}],conversation:'Owner content'});assert.equal(clean.nodes,undefined);assert.equal(clean.conversation,undefined);
});
test('unknown themes, injected CSS and malformed preference files fail validation',()=>{
  for(const value of [{skin:'unknown'},{font:'url(example.invalid)'},{scale:'1000'},{reduceMotion:'true'},{width:'100vw;display:none'}])assert.throws(()=>api.settings(value));
  assert.throws(()=>api.parse(JSON.stringify({schema:'other',settings:api.defaults})));assert.throws(()=>api.parse(' '.repeat(10001)));
});
test('every Nathan AI entry page loads the same scoped appearance engine',()=>{
  const base=path.resolve(__dirname,'..'),pages=[];
  function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(e.name.endsWith('.html'))pages.push(p)}}walk(base);assert.ok(pages.length>=28);
  for(const p of pages){const html=fs.readFileSync(p,'utf8');assert.equal((html.match(/data-nathan-shared-appearance/g)||[]).length,1,p);const style=[...html.matchAll(/href="([^"]*shared\.css)"/g)][0];assert.ok(style,p);assert.equal(path.resolve(path.dirname(p),style[1]),path.join(__dirname,'shared.css'))}
});
test('preference storage and reset never use content, wallet or legacy shell keys',()=>{
  const script=fs.readFileSync(path.join(__dirname,'app.js'),'utf8');assert.doesNotMatch(script,/localStorage\.clear\(|tabor123_projects|one\.v061\.shell\.preferences|innerHTML\s*=/);assert.match(script,/localStorage\.setItem\(api\.KEY/);assert.match(script,/dialog\.showModal/);
});
