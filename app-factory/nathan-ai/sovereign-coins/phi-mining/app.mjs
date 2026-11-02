import {STAGES,GENESIS_NONCE,createMiningCycle,advanceMiningCycle,finishMiningCycle,measuredEfficiency,exportMiningAudit} from './engine.mjs';
const $=id=>document.getElementById(id);
let registry=null,state=null;
const desc=[
 ['Ca²⁺','Activation Interrupt','Verify authorization, target and ring registry'],
 ['Zn²⁺','Computational Flash','Hash 80-byte Bitcoin headers using SHA-256d'],
 ['S_hard','Identity Firewall','Recalculate header digests on Axis Beta'],
 ['C_init','Growth Loop','Prepare a bounded 21-ring plan (zero real jobs)']
];
function paint(){
 $('stage-grid').replaceChildren();
 desc.forEach(([symbol,title,detail],i)=>{
  const card=document.createElement('div');card.className='stage'+(state?.stage_index>i?' done':'');
  for(const [tag,label] of [['strong',symbol],['h3',(i+1)+'. '+title],['p',detail],['small',state?.stage_index>i?'COMPLETE · LOCAL ONLY':'NOT RUN']]){
   const n=document.createElement(tag);n.textContent=label;card.append(n);
  }$('stage-grid').append(card);
 });
 $('export-cycle').disabled=state?.status!=='COMPLETE';
 if(!state){$('results').textContent='No blocks hashed yet.';return}
 $('results').textContent=JSON.stringify({status:state.status,
  axis_alpha:state.alpha,axis_beta:state.beta,
  local_stages:state.events,planned_real_mining_jobs:state.plan?.real_jobs_scheduled??0},null,2);
}
function renderRings(){
 $('rings').replaceChildren();
 const body=$('rings');
 for(const ring of registry.coins){
  const tr=document.createElement('tr');
  [ring.number+' · '+ring.ticker,ring.name,'Mapped after run','NOT CONNECTED'].forEach(s=>{
    const cell=document.createElement('td');cell.textContent=s;tr.append(cell);
  });body.append(tr);
 }
}
function updateRings(){
 if(!state?.plan)return;
 [...$('rings').rows].forEach((tr,i)=>{
  const r=state.plan.rings[i];
  tr.cells[2].textContent=r.virtual_range[0].toLocaleString()+' – '+(r.virtual_range[1]-1).toLocaleString();
 });
}
function initCycle(){
 const startNonce=Number($('start-nonce').value),attempts=Number($('attempts').value);
 const consent=$('consent').checked;
 if(!registry)throw Error('Source registry not loaded');
 return createMiningCycle(registry,{startNonce,attempts,consent});
}
async function act(all){
 const run=$('run-cycle'),step=$('one-step');
 run.disabled=step.disabled=true;
 try{
  if(!state)state=initCycle();
  state=all?await finishMiningCycle(state,registry):await advanceMiningCycle(state,registry);
  paint();updateRings();
  $('status').textContent=state.status==='COMPLETE'
    ?'Four stages completed. Local historical PoW test only; no pool or wallet contacted.'
    :'Stage '+state.stage_index+' / 4 completed. No external activity.';
 }catch(e){$('status').textContent='Stopped: '+e.message;}
 finally{run.disabled=step.disabled=state?.status==='COMPLETE';}
}
function exportAudit(){
 try{
 const text=JSON.stringify(exportMiningAudit(state),null,2)+'\n';
 const url=URL.createObjectURL(new Blob([text],{type:'application/json'}));
 const a=document.createElement('a');a.href=url;a.download='NATHAN_AI_PHI_MINE_LOCAL_AUDIT.json';
 document.body.append(a);a.click();a.remove();URL.revokeObjectURL(url);
 }catch(e){$('status').textContent=e.message}
}
function calculate(){
 try{
  const fields=['usd-output','kwh','rate'].map(id=>$(id).value.trim());
  if(fields.some(s=>s===''))throw Error('Fill all three measured inputs for one reporting period.');
  const n=fields.map(Number),output=measuredEfficiency(...n);
  $('efficiency-result').textContent=output.output_to_electricity_ratio===null
    ?'Ratio undefined with zero measured electricity cost.'
    :'Output/electricity: '+output.output_to_electricity_ratio.toFixed(3)+':1 · 16:1 design target reached in entered data: '+(output.target_16_to_1_met?'YES':'NO')+' · Other operating costs not included.';
 }catch(e){$('efficiency-result').textContent=e.message;}
}
async function init(){
 try{
 const r=await fetch('../registry.json');if(!r.ok)throw Error('21-ring registry unavailable');
 registry=await r.json();renderRings();paint();
 $('job-form').addEventListener('submit',async e=>{e.preventDefault();await act(true)});
 $('one-step').addEventListener('click',()=>act(false));
 $('reset-cycle').addEventListener('click',()=>{state=null;paint();renderRings();$('status').textContent='Reset. No activity running.';$('one-step').disabled=$('run-cycle').disabled=false;});
 $('export-cycle').addEventListener('click',exportAudit);
 $('efficiency').addEventListener('click',calculate);
 }catch(e){$('status').textContent='Module initialization blocked: '+e.message;$('run-cycle').disabled=$('one-step').disabled=true}
}
init();
