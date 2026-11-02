import {TOTAL_VIRTUAL_NODES,STAGE_META,createSimulation,advanceSimulation,completeSimulation,inspectVirtualNode,exportReport} from './engine.mjs';
const $=id=>document.getElementById(id);
let registry, source, state;
function element(tag,value,classname){const node=document.createElement(tag);if(value!==undefined)node.textContent=String(value);if(classname)node.className=classname;return node;}
function format(n){return Number(n).toLocaleString('en-US');}
function render(){
  $('virtual-count').textContent=format(state.virtual_nodes);
  $('real-count').textContent=String(state.physically_connected_nodes);
  $('ring-count').textContent=String(state.rings.length);
  $('progress').textContent=state.stage_index+' / 4';
  $('progress-bar').setAttribute('aria-valuenow',String(state.stage_index));
  $('progress-fill').style.width=(state.stage_index*25)+'%';
  $('step').disabled=$('run-all').disabled=state.stage_index>=4;
  $('status').textContent=state.stage_index===4?'Initialization sequence completed — narrative simulation only.':
    state.stage_index===0?'Ready. No narrative stages executed.':
    'Simulated '+state.stage_index+' of 4 stages. No real nodes contacted.';
  const list=$('stage-list');list.replaceChildren();
  STAGE_META.forEach((step,i)=>{
    const completed=state.stage_index>i;
    const wrap=element('article',undefined,'step'+(completed?' active':''));
    wrap.append(element('div','0'+(i+1),'number'),element('div',step.symbol,'symbol'),element('h3',step.label),
      element('p',step.message,'small'),element('div',completed?'SIMULATED':'NOT RUN','condition'));
    list.append(wrap);
  });
  $('simulation-report').textContent=state.events.length?state.events.map(e=>[
    '['+e.sequence+'/4] '+e.stage.toUpperCase(), '  '+e.message,
    '  Logical addresses represented: '+format(e.virtual_targets),
    '  Physical external changes: '+e.external_changes
  ].join('\n')).join('\n\n'):'No simulated events yet.';
  $('final-message').classList.toggle('hidden',state.stage_index!==4);
  $('final-message').textContent=state.stage_index===4?source.narrative_dialogue:'';
}
function renderRings(){const container=$('ring-list');container.replaceChildren();for(const ring of state.rings){
  const item=element('div',undefined,'ring');item.append(element('strong',ring.number.toString().padStart(2,'0')+' · '+ring.ticker),
  element('span',ring.name),element('span',format(ring.virtual_count)+' virtual addresses'),
  element('span',format(ring.start)+' – '+format(ring.end_exclusive-1)));container.append(item);
}}
function renderSources(){const wrap=$('source-stages');wrap.replaceChildren();for(const s of source.stages){
  const section=element('section',undefined,'card');section.append(element('h3',s.source_title),
  element('p','Original: “'+s.source_phrase+'”'),element('p','Software scope: '+s.implementation,'small'));wrap.append(section);
}}
function lookup(){const raw=$('node-id').value;
  try{if(raw.trim()==='')throw Error('Enter a virtual node ID.');
    const info=inspectVirtualNode(state,registry,Number(raw));$('node-result').textContent=JSON.stringify(info,null,2);
  }catch(e){$('node-result').textContent='Inspection error: '+e.message;}
}
function download(){
  const body=JSON.stringify(exportReport(state,registry),null,2)+'\n';
  const url=URL.createObjectURL(new Blob([body],{type:'application/json'}));
  const link=document.createElement('a');link.href=url;link.download='NATHAN_AI_PHI_LIFE_732M_VIRTUAL_SIMULATION.json';
  document.body.append(link);link.click();link.remove();URL.revokeObjectURL(url);
}
async function init(){
  try{
    const [r,s]=await Promise.all([fetch('../sovereign-coins/registry.json'),fetch('./source.json')]);
    if(!r.ok||!s.ok)throw Error('Canonical 21-ring registry or author source cannot be loaded.');
    [registry,source]=await Promise.all([r.json(),s.json()]);
    if(source.simulated_nodes!==TOTAL_VIRTUAL_NODES||source.stages.length!==4)throw Error('Authored source invariants changed.');
    state=createSimulation(registry,new Date().toISOString());render();renderRings();renderSources();
    $('step').addEventListener('click',()=>{state=advanceSimulation(state,registry,new Date().toISOString());render();});
    $('run-all').addEventListener('click',()=>{state=completeSimulation(state,registry,new Date().toISOString());render();});
    $('reset').addEventListener('click',()=>{state=createSimulation(registry,new Date().toISOString());render();$('node-result').textContent='No logical node inspected.';});
    $('lookup').addEventListener('click',lookup);
    $('export').addEventListener('click',download);
  }catch(error){$('status').textContent='Unable to initialize local simulation: '+error.message;
    for(const id of ['step','run-all','reset','export','lookup'])$(id).disabled=true;
  }
}
init();
