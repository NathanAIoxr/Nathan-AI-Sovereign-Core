/* Browser controls for AnchoredSovereignMatrix. No remote API/wallet use. */
import {makePacket,evaluatePacket,recordAudit,waveValue} from './anchored-matrix.mjs';
import {auditLedger,createLedger,addLocalEvent} from '../engine.mjs';
const $=id=>document.getElementById(id);
const AUDIT_KEY='nathan.ai.anchored.audit.local.v1';
const LEDGER_KEY='nathan.ai.sovereign.coins.local.v1';
let registry=null,history=[],verdict=null;
const make=(tag,content)=>{const e=document.createElement(tag);e.textContent=String(content??'');return e;};
function safeRead(key,defaultValue) {
  try {const value=localStorage.getItem(key);return value?JSON.parse(value):defaultValue;}
  catch(_) {return defaultValue;}
}
function safeWrite(key,value) {
  try {localStorage.setItem(key,JSON.stringify(value));return true;}
  catch(_) {$('gate-message').textContent='Unable to save browser-local data. Export a copy before leaving.';return false;}
}
function verifiedHistory(candidate) {
  if(!Array.isArray(candidate)||candidate.length>5000)return [];
  return candidate.filter(r=>r?.schema==='nathan-ai.anchored-audit.v1' &&
   Number.isSafeInteger(r.sequence)&&['QUARANTINE','INSPECTED','RETAINED'].includes(r.status)&&
   Number.isSafeInteger(r.nonce)&&typeof r.ticker==='string'&&typeof r.created_at==='string');
}
function displayHistory(){
  const lines=history.slice(-20).reverse().map(x=>[
    '#'+x.sequence,x.created_at,x.ticker,'nonce='+x.nonce,'gate='+x.gate,
    x.status,(x.reasons||[]).join('; '),x.digest_sha256||''
  ].filter(Boolean).join(' · '));
  $('audit-history').textContent=lines.length?lines.join('\n\n'):'No inspections yet.';
}
function viewResult(result){
  const gate=$('gate-output');gate.textContent=result.gate===1?'MATCH = 1 · STRUCTURAL PASS':'MISMATCH = 0 · QUARANTINE';
  gate.className='quality '+(result.gate===1?'g1':'g0');
  $('binary-state').textContent=String(result.gate);
  $('gate-reasons').textContent=result.reasons.length?result.reasons.join(' · '):
   'Format, whole-number units, declared demo consent, cryptographic integrity and duplicate-nonce check passed. This does not prove ethical intention.';
  $('alpha-status').textContent=result.alpha?'Computed':'Not computed';
  $('beta-status').textContent=result.beta?(result.beta.ok?'Independent digest matches':'Audit mismatch'):'Not computed';
  $('last-hash').textContent=result.alpha?.digest_sha256||'No hash computed for rejected format.';
  $('reverse-status').textContent=result.beta?.reverse_fields?.map(row=>row[0]).join(' → ')||'No reverse inspection';
  $('record-approved').disabled=result.gate!==1;
  $('gate-message').textContent=result.gate===1?
    'Structural pass. Local ledger retention requires pressing the separate Retain button.':
    'The packet was rejected locally. No ledger units were added.';
}
function download(name,data) {
  const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)+'\n'],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function drawSource(data){
  const wrap=$('source-notes');wrap.replaceChildren();
  for(const [section,rows] of [['I. THE FORMULAS',data.mathematics],['II. THE METHODS',data.methods],['III. THE GATES',data.gates]]){
    const h=make('h3',section);wrap.append(h);
    for(const item of rows){
      const box=make('article');box.className='source-item';
      box.append(make('h3',item.name+(item.expression?' · '+item.expression:'')),make('p',item.statement));wrap.append(box);
    }
  }
}
function sampleWave(){
  const amplitude=Number($('amp').value),waveNumber=Number($('k').value),
    angularFrequency=Number($('omega').value),time=Number($('time').value),phase=Number($('phase').value);
  const width=68,height=13;
  try{
    const series=Array.from({length:width},(_,i)=>waveValue({amplitude,waveNumber,position:i/6,angularFrequency,time,phase}));
    const peak=Math.max(Math.abs(amplitude),0.00001);
    const levels=series.map(v=>Math.max(0,Math.min(height-1,Math.round((1-v/peak)*(height-1)/2))));
    const lines=Array.from({length:height},(_,y)=>levels.map(level=>level===y?'●':y===(height-1)/2?'─':' ').join(''));
    $('wave-shape').textContent=lines.join('\n')+'\n x=0 to '+(width-1)/6+'  ·  illustrative values only';
  }catch(error){$('wave-shape').textContent=error.message;}
}
async function init(){
  try{
    const [r,s]=await Promise.all([fetch('../registry.json'),fetch('./source.json')]);
    if(!r.ok||!s.ok)throw Error('Source registry or statements could not load');
    registry=await r.json();
    const source=await s.json();
    for(const c of registry.coins){const option=make('option',c.ticker+' — '+c.name);option.value=c.ticker;$('ring').append(option);}
    drawSource(source);
    history=verifiedHistory(safeRead(AUDIT_KEY,[]));displayHistory();sampleWave();
  }catch(error){$('gate-message').textContent='Module sources unavailable: '+error.message;return;}
  $('matrix-form').addEventListener('submit',async event=>{
    event.preventDefault();
    if(history.length>=5000){$('gate-message').textContent='Inspection history is full; export and clear the local history before continuing.';return;}
    const packet=makePacket({ticker:$('ring').value,nonce:Number($('nonce').value),
      units:Number($('units').value),payload:$('payload').value,consent:$('consent').checked});
    try{
      verdict=await evaluatePacket(packet,registry,history);
      history=recordAudit(verdict,history);
      safeWrite(AUDIT_KEY,history);
      displayHistory();viewResult(verdict);
    }catch(error){$('gate-message').textContent='Validation error: '+error.message;}
  });
  $('record-approved').addEventListener('click',()=>{
    if(!verdict||verdict.gate!==1)return;
    if(history.some(r=>r.status==='RETAINED'&&r.ticker===verdict.packet.ticker&&r.nonce===verdict.packet.nonce)){
      $('gate-message').textContent='That nonce has already been retained for this ticker.';
      $('record-approved').disabled=true;return;
    }
    try{
      const current=safeRead(LEDGER_KEY,createLedger());
      const chk=auditLedger(registry,current);
      if(!chk.ok)throw Error('Existing ledger validation failed: '+chk.issues.join('; '));
      const next=addLocalEvent(registry,current,{
        ticker:verdict.packet.ticker,delta_units:verdict.packet.units,
        description:'AnchoredSovereignMatrix gate 1 · nonce '+verdict.packet.nonce+' · SHA-256 '+verdict.alpha.digest_sha256.slice(0,22)
      });
      if(!safeWrite(LEDGER_KEY,next))throw Error('Ledger local save did not complete.');
      const last=history.at(-1);
      if(last&&last.status==='INSPECTED'&&last.digest_sha256===verdict.alpha.digest_sha256)last.status='RETAINED';
      safeWrite(AUDIT_KEY,history);displayHistory();
      $('record-approved').disabled=true;
      $('gate-message').textContent='Retained '+verdict.packet.units+' DEMO unit(s) in the '+verdict.packet.ticker+' browser ledger. Open the 21-ring ledger screen to inspect.';
    }catch(error){$('gate-message').textContent='Demo retention blocked: '+error.message;}
  });
  $('export-audit').addEventListener('click',()=>download('NATHAN_AI_ANCHORED_AUDIT_LOCAL.json',{
    schema:'nathan-ai.anchored-audit.export.v1',exported_at:new Date().toISOString(),events:history
  }));
  $('clear-audit').addEventListener('click',()=>{
    if(!confirm('Clear only this browser\'s Anchored Matrix inspection history? Existing retained ledger transactions will NOT be erased.'))return;
    history=[];safeWrite(AUDIT_KEY,history);displayHistory();
    $('gate-message').textContent='Local inspection history cleared. Ledger remains unchanged.';
  });
  $('plot-wave').addEventListener('click',sampleWave);
}
init();
