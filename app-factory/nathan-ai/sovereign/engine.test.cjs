'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const api=require('./engine.js');
function sample(){const w=api.seed();w.nodes.push(api.node({id:'coin:EXAMPLE',kind:'coin',title:'Example coin definition',symbol:'EXAMPLE',summary:'Source words <script>never execute</script>',source:'Test fixture',notes:''}));return w}
test('source-only seed does not fabricate coin definitions, funds or private history',()=>{
  const w=api.seed();assert.equal(w.nodes.filter(n=>n.kind==='coin').length,0);assert.equal(w.observations.length,0);
  assert.ok(w.nodes.some(n=>n.id==='system:voicebox'));assert.ok(w.nodes.some(n=>n.id==='source:sin-earlier'));
  assert.equal(w.nodes.filter(n=>n.kind==='timeline').length,0);
  assert.deepEqual(api.validate(w),w);
});
test('import is atomic and rejects duplicate IDs, dangling links, invalid dates and unsupported relations',()=>{
  const w=sample(),before=JSON.stringify(w);
  const cases=[{...w,nodes:[...w.nodes,w.nodes[0]]},
    {...w,edges:[...w.edges,{id:'broken',from:'missing',to:'coin:EXAMPLE',relation:'relates-to',source:'source'}]},
    {...w,nodes:w.nodes.map(n=>n.kind==='coin'?{...n,date:'2026-02-30'}:n)},
    {...w,edges:[{id:'bad',from:'system:voicebox',to:'coin:EXAMPLE',relation:'executes',source:'source'}]}];
  for(const value of cases)assert.throws(()=>api.parse(JSON.stringify(value)));
  assert.equal(JSON.stringify(w),before);
});
test('unknown credential and executable-link fields are not retained by the workspace schema',()=>{
  const w=sample();w.passphrase='fixture secret';w.nodes[0].href='javascript:alert(1)';w.nodes[0].private_key='fixture key';
  const parsed=api.parse(JSON.stringify(w));assert.equal(parsed.passphrase,undefined);assert.equal(parsed.nodes[0].href,undefined);assert.equal(parsed.nodes[0].private_key,undefined);
  assert.equal(parsed.nodes.at(-1).summary,'Source words <script>never execute</script>');
});
test('merge keeps existing annotations and reports source conflicts without overwriting',()=>{
  const current=sample(),incoming=sample();current.nodes.at(-1).notes='My existing notes';incoming.nodes.at(-1).notes='Incoming competing notes';
  incoming.nodes.push(api.node({id:'timeline:one',kind:'timeline',title:'My milestone',source:'My original',date:'2026-11-02'}));
  const result=api.merge(current,incoming);assert.equal(result.added,1);assert.equal(result.conflicts,1);assert.equal(result.workspace.nodes.find(n=>n.id==='coin:EXAMPLE').notes,'My existing notes');
  assert.equal(api.merge(result.workspace,incoming).added,0);
});
test('money uses exact cents and never treats source claims as receipt observations',()=>{
  const w=sample();w.nodes.push(api.node({id:'claim:value',kind:'claim',title:'Valuation statement',summary:'Claimed monetary value',source:'Source'}));
  assert.equal(api.totals(w).count,0);
  w.observations.push({id:'observation:one',coinId:'coin:EXAMPLE',date:'2026-11-02',units:'0.000000000000000001',proceeds:'1.01',costs:'0.99',evidence:'Receipt fixture',note:''});
  const totals=api.totals(api.validate(w));assert.equal(totals.proceeds,'$1.01');assert.equal(totals.costs,'$0.99');assert.equal(totals.net,'$0.02');assert.equal(totals.ratio,'1.02');
  assert.equal(api.money(api.cents('900719925474099.01')),'$900,719,925,474,099.01');
  w.observations[0].costs='0';assert.equal(api.totals(api.validate(w)).ratio,null);
  for(const value of ['-1','NaN','1e5','1.001','Infinity'])assert.throws(()=>api.cents(value));
});
test('observation needs a coin, valid date, supported precision and receipt reference',()=>{
  const w=sample(),base={id:'obs:one',coinId:'coin:EXAMPLE',date:'2026-11-02',units:'1',proceeds:'16',costs:'1',evidence:'Source',note:''};
  for(const change of [{coinId:'system:voicebox'},{date:'bad'},{units:'1e20'},{units:'0.0000000000000000001'},{evidence:''}])assert.throws(()=>api.validate({...w,observations:[{...base,...change}]}));
});
test('stale tabs and quota errors preserve persisted workspace',()=>{
  let stored=null;const storage={getItem:()=>stored,setItem:(key,value)=>{stored=value}};
  const w=sample();api.save(storage,w,null);const baseline=stored;
  w.nodes.at(-1).notes='Other tab';api.save(storage,w,baseline);
  assert.throws(()=>api.save(storage,sample(),baseline),/Another tab/);assert.equal(JSON.parse(stored).nodes.at(-1).notes,'Other tab');
  const before=stored;assert.throws(()=>api.save({getItem:()=>stored,setItem(){throw Error('quota')}},w,stored),/quota/);assert.equal(stored,before);
});
test('source graph has namespaced references and reversible neighbor lookup',()=>{
  const w=sample();w.edges.push({id:'edge:sample',from:'coin:EXAMPLE',to:'system:voicebox',relation:'linked-by-owner',source:'Owner reference',note:'Connection is explicitly chosen'});
  assert.equal(api.neighbors(w,'coin:EXAMPLE')[0].node.id,'system:voicebox');
  assert.ok(api.neighbors(w,'system:voicebox').some(x=>x.node.id==='coin:EXAMPLE'));
  assert.equal(api.query(w,'source words','coin').length,1);
});
test('exact life formula and node runtime are connected in the source graph',()=>{
  const w=api.seed(),runtime=require('../node-runtime/engine.js');
  assert.equal(w.nodes.find(n=>n.id==='formula:life').summary,runtime.LIFE_FORMULA);
  assert.ok(api.neighbors(w,'formula:life').some(x=>x.node.id==='system:node-runtime'));
});
test('bounded packets and public shell use existing original-source routes',()=>{
  assert.throws(()=>api.parse(' '.repeat(10*1024*1024+1)),/exceeds 10 MB/);
  const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
  for(const id of ['matrix','connections','timeline','methods','ledger','sources'])assert.match(html,new RegExp('id="'+id+'"'));
  const script=fs.readFileSync(path.join(__dirname,'app.js'),'utf8');assert.doesNotMatch(script,/innerHTML\s*=|\beval\s*\(|\bfetch\s*\(/);
  assert.match(html,/one\/offloader\/index\.html/);assert.match(html,/vault\.html/);
});
