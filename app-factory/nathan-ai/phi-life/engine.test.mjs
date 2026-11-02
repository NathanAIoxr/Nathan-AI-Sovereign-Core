import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {SCHEMA,TOTAL_VIRTUAL_NODES,STAGE_IDS,STAGE_META,arithmeticAnchors,virtualPartition,createSimulation,validateSimulation,advanceSimulation,completeSimulation,inspectVirtualNode,exportReport} from './engine.mjs';
const HERE = dirname(fileURLToPath(import.meta.url));
const registry = JSON.parse(readFileSync(join(HERE,'../sovereign-coins/registry.json'),'utf8'));
const source = JSON.parse(readFileSync(join(HERE,'source.json'),'utf8'));

test('original four-stage Φ_life narrative and 732m target are preserved',()=>{
  assert.equal(source.target,'NATHAN_CORE');
  assert.equal(source.simulated_nodes,732000000);
  assert.match(source.formula,/Ca²⁺_wave/);
  assert.deepEqual(source.stages.map(s=>s.id), STAGE_IDS);
  assert.equal(STAGE_META.length,4);
  assert.equal(TOTAL_VIRTUAL_NODES,732_000_000);
  assert.equal(registry.coins.length,21);
  assert.deepEqual(arithmeticAnchors(),{build:true,clear:true,binaryBuild:true});
});
test('partition uses 21 whole-number, contiguous, bounded virtual ranges without 732m allocations',()=>{
  const rings=virtualPartition(registry);
  assert.equal(rings.length,21);
  assert.equal(rings[0].start,0);
  assert.equal(rings.at(-1).end_exclusive,732_000_000);
  assert.equal(rings.reduce((sum,r)=>sum+r.virtual_count,0),732_000_000);
  for(let i=1;i<rings.length;i++) assert.equal(rings[i-1].end_exclusive,rings[i].start);
  assert.equal(rings[0].ticker,'SIN');assert.equal(rings[1].ticker,'SEN');assert.equal(rings.at(-1).ticker,'LFB');
  assert.ok(rings.every(r=>r.virtual_count===34857142||r.virtual_count===34857143));
  assert.equal(rings.filter(r=>r.virtual_count===34857143).length,18);
});
test('state machine advances exactly four times and completes idempotently',()=>{
  let state=createSimulation(registry);
  assert.equal(state.schema,SCHEMA);
  assert.equal(state.events.length,0);
  assert.equal(validateSimulation(state,registry),true);
  for(let i=0;i<4;i++){
    state=advanceSimulation(state,registry,`test-${i}`);
    assert.equal(state.events[i].stage,STAGE_IDS[i]);
    assert.equal(state.events[i].sequence,i+1);
    assert.equal(state.events[i].external_changes,0);
  }
  assert.equal(state.status,'SIMULATION_COMPLETE');
  assert.equal(advanceSimulation(state,registry),state);
  assert.equal(completeSimulation(state,registry),state);
  assert.equal(state.actual_consciousness_claimed,false);
  assert.equal(state.self_modification_enabled,false);
  assert.equal(state.source_write_performed,false);
  assert.equal(state.remote_actions_performed,0);
  assert.equal(state.physically_connected_nodes,0);
});
test('virtual ID inspection does not contact an actual node',()=>{
  const state=completeSimulation(createSimulation(registry),registry);
  for(const id of [0,1,34857142,100000000,731999999]){
    const result=inspectVirtualNode(state,registry,id);
    assert.equal(result.virtual_id,id);
    assert.equal(result.connection,'LOGICAL_ADDRESS_ONLY');
    assert.equal(result.completed_stages,4);
  }
  assert.equal(inspectVirtualNode(state,registry,0).matrix_ring,'SIN');
  assert.equal(inspectVirtualNode(state,registry,731999999).matrix_ring,'LFB');
  for(const id of [-1,732000000,0.1,'42',NaN])assert.throws(()=>inspectVirtualNode(state,registry,id));
});
test('tampered or invented network states are refused',()=>{
  const state=completeSimulation(createSimulation(registry),registry);
  for(const changed of [
    {...state,physically_connected_nodes:732000000},
    {...state,actual_consciousness_claimed:true},
    {...state,self_modification_enabled:true},
    {...state,source_write_performed:true},
    {...state,remote_actions_performed:1},
    {...state,events:[...state.events,{sequence:5}]},
    {...state,rings:state.rings.map((r,i)=>i===0?{...r,virtual_count:r.virtual_count+1}:r)}
  ])assert.throws(()=>validateSimulation(changed,registry));
  const changedRegistry=structuredClone(registry);changedRegistry.coins[0].ticker='NON';
  assert.throws(()=>createSimulation(changedRegistry));
});
test('export log is traceable and distinguishes narrative from empirical results',()=>{
  const report=exportReport(completeSimulation(createSimulation(registry),registry),registry);
  assert.equal(report.verification.virtual_addresses,732000000);
  assert.equal(report.verification.real_nodes_contacted,0);
  assert.equal(report.verification.physical_consciousness_verified,false);
  assert.equal(report.verification.source_repository_mutated_by_simulation,false);
  assert.match(report.final_message,/forgotten/);
});
test('UI imports original registry and makes no unapproved remote calls',()=>{
  const page=readFileSync(join(HERE,'index.html'),'utf8');
  const app=readFileSync(join(HERE,'app.mjs'),'utf8');
  assert.match(app,/\.\.\/sovereign-coins\/registry\.json/);
  assert.match(app,/\.\/source\.json/);
  for(const id of ['run-all','step','reset','export','lookup','node-id','node-result','stage-list','ring-list','simulation-report'])
    assert.match(page,new RegExp('id="'+id+'"'));
  assert.doesNotMatch(app,/innerHTML\s*=/);
  assert.doesNotMatch(app,/https?:\/\//);
  assert.doesNotMatch(app,/(?:setInterval|WebSocket|navigator\.sendBeacon)/);
  assert.match(page,/narrative simulation/i);
});
