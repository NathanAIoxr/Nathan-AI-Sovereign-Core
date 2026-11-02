const $ = id => document.getElementById(id);
let providers=[];
let connectionState=new Map();
function make(tag, text, className){const node=document.createElement(tag);if(text!==undefined)node.textContent=String(text);if(className)node.className=className;return node}
function render(){
  const grid=$('provider-grid');grid.replaceChildren();
  for(const p of providers){
    const card=make('article',undefined,'provider');
    card.append(make('h3',p.name),make('div',p.group+' · '+p.mode.toUpperCase(),'meta'),make('p',p.description));
    const state=connectionState.get(p.id);
    const status=state===undefined?'Not checked':state?'Configured (not necessarily responding)':'Not configured';
    card.append(make('div',status,'status'+(state?' live':'')));
    const a=make('a','Provider documentation');a.href=p.docs;a.target='_blank';a.rel='noopener noreferrer';card.append(a);
    if(p.mode==='read'){
      const button=make('button','Read source');button.type='button';button.style.display='block';button.style.marginTop='12px';
      button.addEventListener('click',()=>readOne(p.id));card.append(button);
    }else{
      card.append(make('p',p.mode==='sdk'?'SDK authorization is deliberately not automatic.':'Setup contract only; credentials/provider configuration required.','small'));
    }
    grid.append(card);
  }
}
function token(){return $('session-token').value.trim()}
async function gateway(path){
  if(!token())throw new Error('Enter the gateway session token shown in your local terminal.');
  const res=await fetch(path,{headers:{Authorization:'Bearer '+token()},cache:'no-store'});
  let data;try{data=await res.json()}catch{throw new Error('Local gateway unavailable or returned an invalid response.')}
  if(!res.ok)throw new Error(data.error||'Local request failed ('+res.status+')');
  return data;
}
function appendObservation(data){
  const el=$('observations');const previous=el.dataset.any?el.textContent+'\n\n':'';
  el.textContent=(previous+JSON.stringify(data,null,2)).slice(-50000);el.dataset.any='1';
}
async function check(){
  $('connection-status').textContent='Checking locally configured sources…';
  try{
    const result=await gateway('/api/providers');connectionState=new Map(result.providers.map(p=>[p.id,p.configured]));
    render();$('connection-status').textContent=result.providers.filter(p=>p.configured).length+' configured read-only sources. Not all configured sources are reachable.';
  }catch(err){$('connection-status').textContent=err.message;}
}
async function readOne(id){
  $('connection-status').textContent='Reading '+id+'…';
  try{const data=await gateway('/api/read?id='+encodeURIComponent(id));appendObservation(data);
    $('connection-status').textContent='Received read-only response from '+id+' at '+data.checked_at;
  }catch(err){$('connection-status').textContent=id+': '+err.message;}
}
async function readAll(){
  try{const r=await gateway('/api/providers');connectionState=new Map(r.providers.map(p=>[p.id,p.configured]));render();
    const ids=r.providers.filter(p=>p.configured&&p.mode==='read').map(p=>p.id);
    if(!ids.length){$('connection-status').textContent='No read-only providers configured.';return}
    for(const id of ids)await readOne(id);
    $('connection-status').textContent='Finished checking '+ids.length+' configured source(s).';
  }catch(err){$('connection-status').textContent=err.message;}
}
function calculate(){
  const a=$('revenue').value.trim(),b=$('electricity').value.trim(),el=$('ratio-result');
  if(!a||!b){el.textContent='Both measured values required for the same reporting period.';return}
  const output=Number(a),cost=Number(b);
  if(!Number.isFinite(output)||!Number.isFinite(cost)||output<0||cost<=0){el.textContent='Enter nonnegative output and positive electricity cost.';return}
  const ratio=output/cost;
  el.textContent='Entered output / electricity = '+ratio.toFixed(3)+':1. Target = 16:1. Meets target in the entered numbers: '+(ratio>=16?'Yes':'No')+'. Does not include hardware, cooling, pool fees or tax.';
}
$('check').addEventListener('click',check);$('all').addEventListener('click',readAll);$('calculate').addEventListener('click',calculate);
try{const res=await fetch('./providers.json');if(!res.ok)throw Error('Provider list unavailable');const data=await res.json();providers=data.providers;render()}
catch(err){$('provider-grid').textContent='Unable to load provider catalog: '+err.message}