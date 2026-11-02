'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const api=require('./workspace.js');
const item={id:'books:records:original-1',title:'Original manuscript',sourceName:'Reading records',collection:'Book research',note:'My interpretation'};
test('every configured catalog loads without omitting source collections or colliding IDs',async()=>{
  const result=await api.load(async url=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(path.resolve(__dirname,url),'utf8'))}));
  assert.equal(result.coverage.length,9);
  assert.ok(result.coverage.every(x=>!x.error));
  assert.equal(result.rows.length,10630);
  assert.equal(new Set(result.rows.map(r=>r.id)).size,result.rows.length);
  const children=api.records({id:'children',name:'Children'},require('./children-innocence/registry.js').projects);
  const roots=api.records({id:'roots',name:'Language roots'},require('./route-raut-root/records.js').searchRecords('','all'));
  assert.equal(children.length,46);assert.equal(roots.length,37);
  const docs=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../one/library-mind/documents.json')));
  for(const doc of docs)assert.ok(result.rows.some(r=>r.source==='books'&&r.body.includes(doc.content)),'Full available reading text retained');
});
test('partial catalog failure keeps other records and identifies missing coverage',async()=>{
  const result=await api.load(async url=>{
    if(url.includes('documents'))throw Error('network unavailable');
    return {ok:true,json:async()=>JSON.parse(fs.readFileSync(path.resolve(__dirname,url),'utf8'))};
  });
  assert.equal(result.rows.length,10630-55);
  assert.equal(result.coverage.filter(x=>x.error).length,1);
  assert.match(result.coverage[0].error,/network unavailable/);
});
test('search includes source body and stage; preserves independent source identities',()=>{
  const rows=[{id:'a',title:'Same title',source:'books',body:'Unusual source phrase',stage:'draft'},
    {id:'b',title:'Same title',source:'games',body:'Playable',stage:'prototype'}];
  assert.deepEqual(api.search(rows,'unusual draft').map(r=>r.id),['a']);
  assert.equal(api.search(rows,'same').length,2);
  assert.equal(api.search(rows,'same','games')[0].id,'b');
});
test('portable notes round trip exactly and omit untrusted URL fields',()=>{
  const input={schema:api.SCHEMA,items:[{...item,note:'<script>never execute</script>\nExact notes',href:'javascript:alert(1)'}]};
  const parsed=api.parseBackup(JSON.stringify(input));
  assert.equal(parsed.items[0].note,input.items[0].note);
  assert.equal(parsed.items[0].href,undefined);
  assert.deepEqual(api.parseBackup(JSON.stringify(parsed)),parsed);
});
test('backup merge retains existing notes and collections on duplicate references',()=>{
  const current={schema:api.SCHEMA,items:[item]};
  const result=api.merge(current,{schema:api.SCHEMA,items:[{...item,note:'replacement'}, {...item,id:'second',title:'Second source'}]});
  assert.equal(result.added,1);assert.equal(result.skipped,1);
  assert.equal(result.workspace.items[0].note,item.note);
  assert.equal(current.items.length,1);
});
test('malformed, oversized and duplicate backup records fail before saving',()=>{
  for(const data of [{schema:'other',items:[]},{schema:api.SCHEMA,items:[item,item]},
    {schema:api.SCHEMA,items:[{...item,note:42}]},{schema:api.SCHEMA,items:[{...item,note:'x'.repeat(20001)}]}])
    assert.throws(()=>api.parseBackup(JSON.stringify(data)));
  assert.throws(()=>api.parseBackup(' '.repeat(5*1024*1024+1)),/exceeds 5 MB/);
});
test('storage failure propagates without mutating previous notes',()=>{
  const current={schema:api.SCHEMA,items:[item]};
  assert.throws(()=>api.persist({setItem(){throw Error('quota exceeded')}},current),/quota exceeded/);
  assert.equal(current.items[0].note,item.note);
});
test('catalog metadata does not copy private account URLs into workspace records',()=>{
  const [r]=api.records({id:'test',name:'Source',href:'./safe.html'},[{id:'one',title:'Source',source_name:'https://chatgpt.com/library?private',repository_url:'https://private.example',description:'Index only'}]);
  assert.doesNotMatch(r.body,/https:/);
  assert.equal(r.href,'./safe.html');
});
