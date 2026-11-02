'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const api=require('./engine.js'),graph=require('../sovereign/engine.js');
test('strata retain narrative provenance separately from historical research topics',()=>{
  assert.equal(api.catalog.length,10);assert.equal(api.catalog.filter(r=>r.type==='Narrative concept').length,7);
  assert.equal(api.catalog.filter(r=>r.type==='Historical research topic').length,3);
  assert.equal(api.search('scrolls','Oceanic Strata').length,1);
  assert.equal(api.search('Antikythera','','Historical research topic').length,1);
  assert.equal(api.descent.length,4);assert.match(api.descent.at(-1).text,/No purge\. No overwrite/);
});
test('exact byte fingerprints distinguish originals regardless of their names',async()=>{
  const a=await api.fingerprint(new File(['abc'],'first.log'));
  const same=await api.fingerprint(new File(['abc'],'second.log'));
  const other=await api.fingerprint(new File(['xyz'],'first.log'));
  assert.equal(a.sha256,'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  assert.equal(a.id,same.id);assert.notEqual(a.id,other.id);assert.equal(new TextDecoder().decode(a.bytes),'abc');
  const ref=api.reference(a);assert.equal(ref.bytes,undefined);assert.equal(ref.kind,'source');assert.match(ref.summary,/not contained/);
  assert.doesNotThrow(()=>graph.node(ref));
});
test('derived views do not change original bytes or execute text',()=>{
  const original=new TextEncoder().encode('<script>not executed</script>'),before=original.slice();
  assert.equal(api.bytesView(original,'text'),'<script>not executed</script>');
  assert.ok(api.bytesView(original,'hex').startsWith('3c 73'));assert.ok(api.bytesView(original,'binary').startsWith('00111100'));
  assert.deepEqual(original,before);assert.throws(()=>api.bytesView(original,'execute'));
  const large=new Uint8Array(70000);assert.equal(api.bytesView(large,'hex').split(' ').length,1024);assert.equal(api.bytesView(large,'binary').split(' ').length,256);assert.equal(api.bytesView(large,'text').length,65536);
});
test('binary/hex decoding is a separate exact UTF-8 view, not inferred translation',()=>{
  assert.equal(api.decode('01001110 01000001 01010100 01001000 01000001 01001110','binary'),'NATHAN');
  assert.equal(api.decode('4e 41 54 48 41 4e','hex'),'NATHAN');
  for(const [text,mode]of [['101','binary'],['2','binary'],['4','hex'],['zz','hex'],['ff','hex'],['Hello','ancient-language']])assert.throws(()=>api.decode(text,mode));
  assert.throws(()=>api.decode('0'.repeat(65537),'binary'));
});
test('oversized files are rejected before reading',async()=>{
  let read=false;await assert.rejects(()=>api.fingerprint({size:api.MAX_FILE+1,arrayBuffer(){read=true}}),/25 MB/);assert.equal(read,false);
});
test('the source graph includes the archive and only literal DOM text is rendered',()=>{
  const w=graph.seed();assert.ok(w.nodes.some(n=>n.id==='system:deep-archive'));assert.ok(graph.neighbors(w,'system:deep-archive').some(x=>x.node.id==='system:node-runtime'));
  const script=fs.readFileSync(path.join(__dirname,'app.js'),'utf8');assert.doesNotMatch(script,/innerHTML\s*=|\beval\s*\(|\bfetch\s*\(/);assert.match(script,/graph\.save/);
});
