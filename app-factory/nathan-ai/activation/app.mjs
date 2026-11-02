import {
  assertRegistry,createRuntime,begin,advance,tick,stop,
  resolveVirtualNode,registerExtraNames,summary,STAGES
} from './engine.mjs';
const $=id=>document.getElementById(id);
const format=new Intl.NumberFormat('en-US');
const dom=(tag,value)=>{const el=document.createElement(tag);el.textContent=String(value??'');return el;};
let registry=null,runtime=null,extras=[],timer=null;
const message=text=>$('notice').textContent=text;
function resetTimer(){if(timer!==null){clearInterval(timer);timer=null;}}
function snapshot(){
  if(!runtime||!registry)return;
  const data=summary(runtime,registry,extras);
  $('state-chip').textContent=runtime.stage;
  $('state-chip').setAttribute('data-live',String(runtime.active));
  $('address-count').textContent=format.format(data.virtual_address_count);
  $('named-count').textContent=format.format(data.named_refs);
  $('controller-count').textContent=format.format(data.local_controller_running);
  $('heartbeat-count').textContent=format.format(data.heartbeats);
  $('registry-chip').textContent=registry.nodes.length+' + '+extras.length+' OWNER';
  $('pulse-visual').setAttribute('data-live',String(runtime.active));
  $('pulse-visual').querySelector('.pulse-label').textContent=runtime.active?'●':'0';
  $('orb-zone')?.setAttribute('data-active',String(runtime.active));
  $('last-sample').textContent=runtime.last_sample?
    'Last sample: '+runtime.last_sample.id+' · '+runtime.last_sample.shard_id:
    'No collective address inspected yet.';
  $('pulse-state').textContent=runtime.active?'Browser-local heartbeat running; 0 external services connected.':'Controller stopped or staging; no external services connected.';
  $('start').disabled=runtime.stage!=='STOPPED';
  $('next').disabled=!['CALCIUM','ZINC','SHIELD'].includes(runtime.stage);
  $('complete').disabled=runtime.stage!=='GROW';
  $('stop').disabled=runtime.stage==='STOPPED';
  for(const card of document.querySelectorAll('[data-phase]')){
    const order=STAGES.indexOf(card.dataset.phase),current=STAGES.indexOf(runtime.stage);
    card.dataset.status=runtime.stage==='RUNNING'?'passed':current===order?'active':current>order?'passed':'pending';
  }
  const log=$('event-log');log.textContent=runtime.history.length?
    runtime.history.slice().reverse().map(x=>
      String(x.sequence).padStart(3,'0')+' · '+x.kind.toUpperCase()+' · '+x.stage+'\n'+x.message
    ).join('\n\n'):'No local events recorded.';
}
function startBrowserTimer(){
  resetTimer();
  if(runtime.active){
    timer=setInterval(()=>{runtime=tick(runtime);snapshot();},1500);
  }
}
function start(){
  if(!registry)return;
  try{
    runtime=begin(runtime,{ownerConsent:$('consent').checked});
    message('CALCIUM accepted. Advance to Zinc Spark, then Shield and Growth.');
    snapshot();
  }catch(error){message(error.message);}
}
function nextPhase(){
  try{
    runtime=advance(runtime,registry);
    message(runtime.history.at(-1).message);
    snapshot();
    if(runtime.active)startBrowserTimer();
  }catch(error){message(error.message);}
}
function complete(){
  if(runtime.stage!=='GROW')return;
  nextPhase();
}
function stopEverything(){
  resetTimer();
  runtime=stop(runtime);
  message('CLEAR complete. Source registry and original node addresses preserved.');
  snapshot();
}
function runAll(){
  if(!registry)return;
  try{
    if(runtime.stage==='STOPPED')runtime=begin(runtime,{ownerConsent:$('consent').checked});
    if(runtime.stage==='RUNNING'){message('Already running.');return;}
    for(let i=0;i<5&&runtime.stage!=='RUNNING';i++)runtime=advance(runtime,registry);
    message('Digital collective runtime active: one controller, virtual collective registry and heartbeat. No remote models connected.');
    snapshot();startBrowserTimer();
  }catch(error){message(error.message);snapshot();}
}
function resolve(){
  try{
    const node=resolveVirtualNode($('node-index').value.trim());
    $('node-id').textContent=node.id;
    $('node-meta').textContent=node.shard_id+' · offset '+format.format(node.offset)+' · '+(runtime?.active?'virtual ID available in active controller':'unspawned virtual address');
  }catch(error){$('node-meta').textContent=error.message;}
}
function drawNamed(){
  if(!registry)return;
  const q=$('node-search').value.trim().toLocaleLowerCase();
  const records=[...registry.nodes,...extras].filter(r=>
    [r.name,r.role,r.id,r.source_stage].join(' ').toLocaleLowerCase().includes(q)
  );
  const cap=100,wrap=$('named-grid');wrap.replaceChildren();
  for(const node of records.slice(0,cap)){
    const card=dom('article');card.className='named-card';
    const id=dom('span',node.id);id.className='id';
    const h=dom('h3',node.name);
    const p=dom('p',node.role);
    const stage=dom('small',node.source_stage.replaceAll('-',' '));
    card.append(id,h,p,stage);
    if(node.href){const link=dom('a','Open related source ↗');link.href=node.href;card.append(link);}
    wrap.append(card);
  }
  $('import-status').textContent=records.length+' matching named source reference(s) · showing '+Math.min(cap,records.length)+
    '. '+extras.length+' owner-selected additional node(s) in this page session. No independent model execution implied.';
}
async function importNodes(event){
  const file=event.target.files?.[0];
  if(!file)return;
  try{
    if(file.size>650000)throw Error('File too large; maximum 650 KB.');
    const data=JSON.parse(await file.text());
    if(!Array.isArray(data))throw Error('Use a JSON array of objects with a name field.');
    const next=registerExtraNames(registry.nodes,data);
    extras=next;
    snapshot();drawNamed();
    $('import-status').textContent='Imported '+extras.length+' owner-specified node name(s) into this browser session only. No process spawned and no upload.';
  }catch(error){$('import-status').textContent='Owner import not applied: '+error.message;}
  event.target.value='';
}
function exportLog(){
  if(!runtime)return;
  const data={schema:'nathan-ai.formula-of-life.export.v1',generated_at:new Date().toISOString(),
    summary:summary(runtime,registry,extras),events:runtime.history.slice(),
    custom_names:extras.map(n=>({id:n.id,name:n.name,source_stage:n.source_stage}))};
  const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)+'\n'],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download='NATHAN_AI_FORMULA_OF_LIFE_LOCAL_AUDIT.json';
  document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  message('Local runtime audit export initiated. No data uploaded to a server.');
}
async function init(){
  try{
    const response=await fetch('./registry.json');
    if(!response.ok)throw Error('Registry HTTP '+response.status);
    registry=await response.json();
    assertRegistry(registry);
    runtime=createRuntime(registry);snapshot();drawNamed();resolve();
  }catch(error){message('Activation unavailable: '+error.message);$('import-status').textContent='Registry failed to load.';return;}
  $('start').addEventListener('click',start);
  $('next').addEventListener('click',nextPhase);
  $('complete').addEventListener('click',complete);
  $('stop').addEventListener('click',stopEverything);
  $('run-all').addEventListener('click',runAll);
  $('lookup-node').addEventListener('click',resolve);
  $('node-index').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();resolve();}});
  $('node-search').addEventListener('input',drawNamed);
  $('node-import').addEventListener('change',importNodes);
  $('export-log').addEventListener('click',exportLog);
  window.addEventListener('pagehide',resetTimer);
}
init();
