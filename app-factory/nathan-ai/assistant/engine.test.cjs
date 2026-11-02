'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),api=require('./engine.js');
const rows=[{id:'one',title:'Voice Box encryption',body:'Original files use AES-GCM with PBKDF2.',sourceName:'Implementation source',stage:'Local source code'},{id:'two',title:'Voice gateway idea',body:'Narrative voice gateway design.',sourceName:'Owner design',stage:'Concept'}];
test('retrieval ranks exact source terms and preserves original stage and provenance',()=>{
  const result=api.retrieve('Voice Box encryption',rows);assert.equal(result[0].id,'one');assert.equal(result[0].origin,'Implementation source');assert.equal(result[0].stage,'Local source code');assert.match(result[0].excerpt,/AES-GCM/);
  assert.equal(api.retrieve('quantum banana',rows).length,0);assert.match(api.answer('missing',[]).answer,/No matching/);
});
test('local graph/research context is explicit, namespaced and marked private',()=>{
  const result=api.localSources({nodes:[{id:'coin:EXAMPLE',title:'Example',summary:'Owner words',notes:'My note',source:'Owner source',status:'Definition'}]},{items:[{id:'book:one',title:'My book',note:'Research',collection:'Writing',sourceName:'Source'}]});
  assert.ok(result.every(r=>r.private));assert.equal(result[0].id,'local-graph:coin:EXAMPLE');assert.match(result[0].text,/My note/);
});
test('source answer cites retrieved passages and never describes itself as model output',()=>{
  const selected=api.retrieve('encryption',rows),answer=api.answer('encryption',selected,'plan');assert.equal(answer.mode,'source-retrieval');assert.deepEqual(answer.citations,['one']);assert.equal(answer.suggestions.length,3);
  const packet=api.packet('encryption',selected);assert.equal(packet.operation,'draft-only');assert.equal(packet.sources[0].text,selected[0].excerpt);assert.equal(packet.sources[0].private,undefined);
});
test('conversation round trips preserve literal source text and reject malformed backups',()=>{
  const value={schema:api.SCHEMA,turns:[{question:'Question',answer:'<script>literal</script>',mode:'source-retrieval',sources:[{id:'one',title:'Source',excerpt:'Original words',stage:'Draft',private:true}]}]};assert.deepEqual(api.parse(JSON.stringify(value)),value);
  assert.throws(()=>api.parse(JSON.stringify({...value,turns:[{...value.turns[0],mode:'deployed'}]})));assert.throws(()=>api.parse(' '.repeat(2*1024*1024+1)));
});
test('stale saves and quota errors do not overwrite saved conversations',()=>{
  const value={schema:api.SCHEMA,turns:[]};let raw=null;const storage={getItem:()=>raw,setItem:(k,v)=>{raw=v}};api.save(storage,value,null);const before=raw;assert.throws(()=>api.save(storage,value,null),/another tab/);assert.equal(raw,before);assert.throws(()=>api.save({getItem:()=>raw,setItem(){throw Error('quota')}},value,raw),/quota/);assert.equal(raw,before);
});
test('recognizable credential payloads are rejected before retrieval or persistence',()=>{
  assert.throws(()=>api.retrieve('password: example-test-value',rows),/credentials/);
  assert.throws(()=>api.source({id:'bad',text:'-----BEGIN PRIVATE KEY-----'}),/credentials/);
  assert.doesNotThrow(()=>api.noCredentials('Explain password storage without disclosing credentials'));
});
