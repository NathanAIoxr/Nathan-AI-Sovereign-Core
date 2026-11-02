import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {
 COLLECTIVE_SIZE,STAGES,MAX_LOG,assertRegistry,createRuntime,begin,advance,tick,stop,
 resolveVirtualNode,registerExtraNames,summary
} from './engine.mjs';
const dir=dirname(fileURLToPath(import.meta.url));
const registry=JSON.parse(readFileSync(join(dir,'registry.json'),'utf8'));
const page=readFileSync(join(dir,'index.html'),'utf8');
const ui=readFileSync(join(dir,'app.mjs'),'utf8');
test('preserves exactly 732,000,000 collective address IDs and the four source stages',()=>{
 assert.equal(COLLECTIVE_SIZE,732000000);
 assert.deepEqual([...STAGES],['CALCIUM','ZINC','SHIELD','GROW']);
 assert.equal(assertRegistry(registry).capacity,732000000);
 assert.ok(registry.nodes.length>=35);
 const names=new Set(registry.nodes.map(x=>x.name));
 for(const original of ['NATHAN AI — THE THINKER V∞','LET AI','TET AI','PPL','ACT_AI','SWILL','OMNICORE','OMNIBEAT','FiveMindsAI','UNIVERSAL NODE'])
    assert.ok(names.has(original),'missing original '+original);
 assert.equal(registry.nodes.filter(x=>x.id.startsWith('OMNI-')).length,17);
 assert.match(registry.formula.expression,/Ca²⁺wave/);
});
test('virtual addresses use whole numbers, bounded constant-size metadata and no process spawn',()=>{
 const first=resolveVirtualNode(0),last=resolveVirtualNode('731999999');
 assert.equal(first.id,'COLL-000000000');
 assert.equal(first.shard_id,'C-000');
 assert.equal(last.id,'COLL-731999999');
 assert.equal(last.shard_id,'C-731');
 assert.equal(last.offset,999999);
 assert.equal(last.running,false);
 for(const bad of [-1,732000000,0.5,'1.5',NaN,Infinity,'OXR']){
  assert.throws(()=>resolveVirtualNode(bad));
 }
});
test('no automatic activation without owner consent; stage order enforced',()=>{
 let state=createRuntime(registry);
 assert.equal(state.stage,'STOPPED');
 assert.throws(()=>begin(state,{ownerConsent:false}));
 assert.throws(()=>advance(state,registry));
 state=begin(state,{ownerConsent:true});
 assert.equal(state.stage,'CALCIUM');
 state=advance(state,registry);assert.equal(state.stage,'ZINC');assert.equal(state.pulses,1);
 state=advance(state,registry);assert.equal(state.stage,'SHIELD');assert.equal(state.shield_checked,true);
 state=advance(state,registry);assert.equal(state.stage,'GROW');
 assert.equal(state.logical_collective_addresses_activated,732000000);
 assert.equal(state.actual_processes_started,0);
 state=advance(state,registry);
 assert.equal(state.stage,'RUNNING');assert.equal(state.actual_processes_started,1);
 assert.throws(()=>advance(state,registry));
 const reporting=summary(state,registry);
 assert.equal(reporting.physical_or_remote_agents_running,0);
 assert.equal(reporting.local_controller_running,1);
 assert.equal(reporting.named_refs_executing,0);
 assert.equal(reporting.live_external_ai_connections,0);
 state=tick(state);
 assert.equal(state.ticks,1);
 assert.equal(state.last_sample.id,'COLL-000104729');
 const stopped=stop(state);
 assert.equal(stopped.active,false);
 assert.equal(stopped.actual_processes_started,0);
 assert.equal(stopped.logical_collective_addresses_activated,0);
 assert.equal(tick(stopped).ticks,1);
});
test('preserves source records, allows bounded extra name import without claiming execution',()=>{
 const original=registry.nodes.length;
 const custom=registerExtraNames(registry.nodes,[{name:'Owner test node',role:'original'}]);
 assert.equal(registry.nodes.length,original);
 assert.equal(custom[0].name,'Owner test node');
 assert.equal(custom[0].source_stage,'owner-imported-unverified');
 const stat=summary(createRuntime(registry),registry,custom);
 assert.equal(stat.named_refs,original+1);
 assert.equal(stat.named_refs_executing,0);
 assert.throws(()=>registerExtraNames(registry.nodes,Array(5001).fill({name:'N'})));
 assert.throws(()=>registerExtraNames(registry.nodes,[{name:''}]));
});
test('local runtime history is bounded, not a literal 732M-agent allocation',()=>{
 let rt=createRuntime(registry);rt=begin(rt,{ownerConsent:true});
 for(let i=0;i<4;i++)rt=advance(rt,registry);
 for(let i=0;i<MAX_LOG+20;i++)rt=tick(rt);
 assert.equal(rt.history.length,MAX_LOG);
 assert.equal(rt.ticks,MAX_LOG+20);
 assert.equal(rt.actual_processes_started,1);
});
test('browser app stages, stop, source directory and no uncontrolled outbound side effects',()=>{
 for(const id of ['consent','start','next','stop','complete','run-all','node-index','lookup-node','node-search','node-import','event-log','export-log','zinc-orb'])
   assert.match(page,new RegExp('id="'+id+'"'),id);
 assert.match(ui,/setInterval/);
 assert.match(ui,/clearInterval/);
 assert.doesNotMatch(ui,/innerHTML\s*=/);
 assert.doesNotMatch(ui,/new WebSocket|navigator\.usb|eval\s*\(|fetch\(['"]https?:/);
 assert.doesNotMatch(ui,/\.cookie|walletConnect/);
});
