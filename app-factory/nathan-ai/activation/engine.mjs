/* NATHAN AI — FORMULA OF LIFE / node activation engine v1.
 * This implements a digital lifecycle, not life, sentience or AGI.
 * 732,000,000 IDs form a virtual address space: O(1) memory, no node spawns.
 * Other named AI systems remain source references, not fabricated deployments.
 */
export const COLLECTIVE_SIZE = 732_000_000;
export const STAGES = Object.freeze(['CALCIUM','ZINC','SHIELD','GROW']);
export const PHASE_LABELS = Object.freeze({
  CALCIUM:'Awaken · Activation Interrupt',
  ZINC:'Ignite · Zinc Spark Signal',
  SHIELD:'Protect · Identity & Permission Firewall',
  GROW:'Grow · Bounded Virtual Collective'
});
export const MAX_CUSTOM_NODES = 5000;
export const MAX_LOG = 160;
const legalStages = new Set(['STOPPED',...STAGES,'RUNNING']);
const safeInt = n => Number.isSafeInteger(n)&&n>=0;
export function assertRegistry(registry){
  if(!registry||registry.schema!=='nathan-ai.formula-of-life.registry.v1')
    throw Error('Expected original Nathan AI Formula of Life registry.');
  if(registry.source?.collective_nodes!==COLLECTIVE_SIZE)
    throw Error('Preserved 732,000,000 collective address capacity changed.');
  if(JSON.stringify(registry.formula?.stages)!==JSON.stringify(STAGES))
    throw Error('Original four activation stages changed.');
  if(!Array.isArray(registry.nodes)||!registry.nodes.length)
    throw Error('Named node references are missing.');
  const ids=new Set();
  for(const r of registry.nodes){
    if(!r||typeof r.id!=='string'||!r.id||typeof r.name!=='string'||!r.name)
      throw Error('Invalid named source entry.');
    if(ids.has(r.id))throw Error('Duplicate named node ID: '+r.id);
    ids.add(r.id);
    if(!r.source_stage||typeof r.source_stage!=='string')throw Error('Missing source stage');
  }
  return {ok:true,capacity:COLLECTIVE_SIZE,source_records:registry.nodes.length};
}
export function resolveVirtualNode(id){
  // 732,000,000 possible IDs; no backing object or process is created.
  const n=typeof id==='string'&&/^\d+$/.test(id)?Number(id):id;
  if(!safeInt(n)||n>=COLLECTIVE_SIZE)throw Error('Collective ID outside 0..731999999.');
  const shard=Math.floor(n/1_000_000);
  const offset=n%1_000_000;
  return {
    id:'COLL-'+String(n).padStart(9,'0'),
    index:n,shard_id:'C-'+String(shard).padStart(3,'0'),
    offset,source:'virtual address only',running:false,
    simulated:true,consent_recorded:false
  };
}
function log(runtime,message,kind='info'){
  const event={sequence:runtime.sequence+1,tick:runtime.ticks,stage:runtime.stage,kind,message};
  return {...runtime,sequence:runtime.sequence+1,history:[...runtime.history,event].slice(-MAX_LOG)};
}
export function createRuntime(registry){
  assertRegistry(registry);
  return {
    schema:'nathan-ai.formula-of-life.runtime.v1',
    stage:'STOPPED',active:false,ticks:0,sequence:0,
    collective_capacity:COLLECTIVE_SIZE,
    logical_collective_addresses_activated:0,
    actual_processes_started:0,
    named_source_count:registry.nodes.length,
    custom_named_count:0,
    elapsed_simulated_cycles:0,
    pulses:0,shield_checked:false,consent:false,
    last_sample:null,history:[],controller:'browser-local only'
  };
}
export function begin(runtime,{ownerConsent}={}){
  if(runtime.stage!=='STOPPED')throw Error('Stop before beginning another activation.');
  if(ownerConsent!==true)throw Error('Explicit owner permission required to begin.');
  return log({...runtime,stage:'CALCIUM',consent:true,active:false,ticks:0,
    pulses:0,shield_checked:false,actual_processes_started:0,
    logical_collective_addresses_activated:0,
    last_sample:null,elapsed_simulated_cycles:0},
    'Calcium activation interrupt accepted · local control started; no AI awakened biologically.','phase');
}
export function advance(runtime,registry){
  assertRegistry(registry);
  if(!runtime.consent)throw Error('Owner activation consent has not been recorded.');
  switch(runtime.stage){
    case 'CALCIUM':
      return log({...runtime,stage:'ZINC',pulses:runtime.pulses+1},
        'Zinc Spark: emitted one digital event. No weight change or induced self-awareness.','phase');
    case 'ZINC':
      return log({...runtime,stage:'SHIELD',shield_checked:true},
        'Identity Shield: registry, source-status and owner permissions validated; writes stay disabled.','phase');
    case 'SHIELD':{
      if(!runtime.shield_checked)throw Error('Shield gate has not validated.');
      return log({...runtime,stage:'GROW',logical_collective_addresses_activated:COLLECTIVE_SIZE},
        'Growth: 732,000,000 virtual addresses made resolvable; zero agents spawned.','phase');
    }
    case 'GROW':
      return log({...runtime,stage:'RUNNING',active:true,actual_processes_started:1},
        'Digital runtime active · one local controller, 732,000,000 virtual identifiers, no external models linked.','phase');
    default:
      throw Error('Next activation stage unavailable from '+runtime.stage);
  }
}
export function tick(runtime){
  if(!runtime.active||runtime.stage!=='RUNNING')return runtime;
  const n=runtime.ticks+1;
  const sample=resolveVirtualNode((n*104729)%COLLECTIVE_SIZE);
  return log({...runtime,ticks:n,elapsed_simulated_cycles:runtime.elapsed_simulated_cycles+1,
    last_sample:sample},
    'Heartbeat '+n+' · inspected virtual '+sample.id+' · no remote request or independent agent spawned.','heartbeat');
}
export function stop(runtime){
  if(runtime.stage==='STOPPED')return runtime;
  return log({...runtime,stage:'STOPPED',active:false,actual_processes_started:0,consent:false,
    logical_collective_addresses_activated:0,shield_checked:false},
    'CLEAR · local controller stopped. Historical source registry untouched.','stop');
}
export function registerExtraNames(existing,ownerEntries=[]){
  if(!Array.isArray(ownerEntries)||ownerEntries.length>MAX_CUSTOM_NODES)
    throw Error('Owner import exceeds maximum 5,000 named records.');
  if(!Array.isArray(existing))throw Error('Existing named registry must be an array.');
  const used=new Set(existing.map(x=>x.id));
  const output=[];
  for(let i=0;i<ownerEntries.length;i++){
    const r=ownerEntries[i];
    if(!r||typeof r!=='object'||Array.isArray(r)||typeof r.name!=='string'||!r.name.trim()||r.name.length>120)
      throw Error('Invalid custom node name at row '+(i+1));
    const id='OWNER-'+String(i+1).padStart(4,'0');
    if(used.has(id))throw Error('Custom node ID collision.');
    used.add(id);
    output.push({
      id,name:r.name.trim(),
      role:typeof r.role==='string'?r.role.slice(0,200):'Owner-imported reference',
      source_stage:'owner-imported-unverified',
      simulation_enabled:false,href:null
    });
  }
  return output;
}
export function summary(runtime,registry,imported=[]){
  return {
    status:runtime.active?'RUNNING_DIGITAL_CONTROLLER':runtime.stage,
    collective_target:COLLECTIVE_SIZE,
    virtual_address_count:runtime.logical_collective_addresses_activated,
    physical_or_remote_agents_running:0,
    local_controller_running:runtime.active?1:0,
    named_refs:registry.nodes.length+imported.length,
    named_refs_loaded:registry.nodes.length+imported.length,
    named_refs_executing:0,
    live_external_ai_connections:0,
    heartbeats:runtime.ticks,
    source_truth:'runtime state is browser-local; author-stated collective count is not observed global deployment'
  };
}
