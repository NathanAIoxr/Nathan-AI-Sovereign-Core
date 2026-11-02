import {validateRegistry,createLedger,auditLedger,addLocalEvent,summarizeBalances,calculateEfficiency} from './engine.mjs';
const $=id=>document.getElementById(id);
const STORAGE_KEY='nathan.ai.sovereign.coins.local.v1';
const nf=new Intl.NumberFormat('en-US',{maximumFractionDigits:2});
let source=null;
let ledger=null;
let selected='SIN';
const text=(tag,value)=>{const el=document.createElement(tag);el.textContent=String(value??'');return el};
const money=value=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(value);
function save() {
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(ledger));return true}
  catch(_){$('ledger-status').textContent='Browser storage unavailable; local events will last until this tab reloads.';return false}
}
function load() {
  try {
    const raw=localStorage.getItem(STORAGE_KEY);
    if(raw) {
      const candidate=JSON.parse(raw);
      const checked=auditLedger(source,candidate);
      if(checked.ok)return candidate;
      $('ledger-status').textContent='Previously saved demo ledger failed validation. The original browser data was not overwritten.';
    }
  }catch(_) {$('ledger-status').textContent='The saved local ledger could not be read. No existing data was deleted.'}
  return createLedger();
}
function drawCoins() {
  const query=$('ring-search').value.trim().toLocaleLowerCase();
  const rows=source.coins.filter(c=>(c.ticker+' '+c.name+' '+c.definition).toLocaleLowerCase().includes(query));
  const cards=$('ring-grid');cards.replaceChildren();
  for(const c of rows){
    const b=text('button');b.type='button';b.className='ring-card';b.setAttribute('aria-pressed',String(c.ticker===selected));
    const n=text('span',String(c.number).padStart(2,'0')+' / 21');n.className='num';
    const ticker=text('strong',c.ticker);
    const name=text('span',c.name);name.className='ring-name';
    b.append(n,ticker,name);
    b.addEventListener('click',()=>{selected=c.ticker;drawCoins();drawInspector()});
    cards.append(b);
  }
  $('registry-status').textContent=rows.length+' of 21 original definitions shown · Public design registry';
}
function drawInspector() {
  const c=source.coins.find(x=>x.ticker===selected);
  const bal=summarizeBalances(source,ledger).find(x=>x.ticker===selected);
  $('inspector-ticker').textContent=c.ticker;
  $('inspector-title').textContent=c.name;
  $('inspector-description').textContent=c.definition;
  $('inspector-allocation').textContent=nf.format(c.initial_design_units)+' design units';
  $('inspector-balance').textContent=nf.format(bal.local_demo_units)+' demo units';
}
function row(values){
  const tr=text('tr');
  values.forEach(v=>tr.append(text('td',v)));
  return tr;
}
function drawLedger(){
  $('event-count').textContent=nf.format(ledger.entries.length);
  const b=$('balance-rows');b.replaceChildren();
  for(const c of summarizeBalances(source,ledger))
    b.append(row([String(c.number).padStart(2,'0'),c.ticker,nf.format(c.design_allocation_units),nf.format(c.local_demo_units),'Not connected']));
  const h=$('history-rows');h.replaceChildren();
  for(const e of ledger.entries.slice().reverse().slice(0,200))
    h.append(row([e.sequence,e.ticker,(e.delta_units>0?'+':'')+nf.format(e.delta_units),e.description,e.created_at]));
  if(!ledger.entries.length)h.append(row(['—','—','0','No local demo events','—']));
  $('ledger-status').textContent=ledger.entries.length+' local demonstration events; no external mining or network transactions.';
  drawInspector();
}
function fillSelect() {
  const s=$('event-ring');s.replaceChildren();
  for(const c of source.coins){const opt=text('option',c.ticker+' · '+c.name);opt.value=c.ticker;s.append(opt)}
}
function createDownload(filename,object) {
  const raw=JSON.stringify(object,null,2)+'\n';
  const url=URL.createObjectURL(new Blob([raw],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();
  window.setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function handlers(){
  $('ring-search').addEventListener('input',drawCoins);
  $('event-form').addEventListener('submit',event=>{
    event.preventDefault();
    try{
      const numberValue=Number($('event-units').value);
      ledger=addLocalEvent(source,ledger,{ticker:$('event-ring').value,delta_units:numberValue,description:$('event-note').value});
      save();drawLedger();selected=$('event-ring').value;drawCoins();drawInspector();
    }catch(error){$('ledger-status').textContent=error.message}
  });
  $('export-ledger').addEventListener('click',()=>createDownload('NATHAN_AI_21_COIN_LOCAL_LEDGER.json',ledger));
  $('import-ledger').addEventListener('change',async event=>{
    const file=event.target.files[0];if(!file)return;
    try{
      if(file.size>1000000)throw new Error('Local ledger import limited to 1 MB.');
      const obj=JSON.parse(await file.text());
      const res=auditLedger(source,obj);
      if(!res.ok)throw new Error('Import rejected: '+res.issues.slice(0,3).join('; '));
      ledger=obj;save();drawLedger();
    }catch(error){$('ledger-status').textContent=error.message}
    event.target.value='';
  });
  $('reset-ledger').addEventListener('click',()=>{
    if(!window.confirm('Clear only this browser\'s LOCAL demonstration transactions? Original source and registry will be preserved.'))return;
    ledger=createLedger();save();drawLedger();
  });
  $('efficiency-form').addEventListener('submit',event=>{
    event.preventDefault();
    try{
      const result=calculateEfficiency($('energy-cost').value,$('output-value').value,$('energy-kwh').value);
      $('ratio-result').textContent=result.observed_output_per_dollar===null?'N/A':nf.format(result.observed_output_per_dollar)+' : 1';
      $('net-result').textContent=money(result.net_usd);
      $('threshold-result').textContent=money(result.minimum_output_for_16x);
      $('efficiency-status').textContent='Computed from entered figures only. 16× target '+(result.meets_design_target?'met':'not met')+'. This does not establish received mining proceeds or live electrical usage.';
    }catch(error){$('efficiency-status').textContent=error.message}
  });
}
async function initialize(){
  try{
    const response=await fetch('./registry.json',{cache:'no-cache'});
    if(!response.ok)throw new Error('Registry HTTP '+response.status);
    source=await response.json();
    const validated=validateRegistry(source);
    if(!validated.ok)throw new Error('21-ring source validation failed: '+validated.issues.join('; '));
    $('ring-count').textContent=source.coins.length;
    $('foundation').textContent=nf.format(source.coins.reduce((n,c)=>n+c.initial_design_units,0));
    ledger=load();fillSelect();handlers();drawCoins();drawLedger();
  }catch(error){
    $('registry-status').textContent='Source registry unavailable: '+error.message;
    $('ledger-status').textContent='Ledger controls require the 21-ring registry.';
  }
}
initialize();
