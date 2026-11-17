'use strict';
let token = null;
let owner = null;
const byId = id => document.getElementById(id);
const status = text => { byId('status').textContent = text; };
const split = text => text.split(',').map(part => part.trim()).filter(Boolean);
const integer = raw => {const n = Number(raw); if (!Number.isSafeInteger(n)) throw new Error('Safe integer required'); return n;};
let device = null;
const base64url = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
async function hash(value){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(x=>x.toString(16).padStart(2,'0')).join('');}
function keyDatabase(){return new Promise((resolve,reject)=>{const request=indexedDB.open('one-cloud-owner-keys',1);request.onupgradeneeded=()=>request.result.createObjectStore('keys');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
async function deviceStorage(action,value){const db=await keyDatabase();try{return await new Promise((resolve,reject)=>{const tx=db.transaction('keys',action==='read'?'readonly':'readwrite');const store=tx.objectStore('keys');const request=action==='read'?store.get('owner'):store.put(value,'owner');let result;request.onsuccess=()=>{result=request.result;};tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}finally{db.close();}}
async function pairDevice(code){
 const pair=await crypto.subtle.generateKey('Ed25519',false,['sign','verify']);
 const candidate={privateKey:pair.privateKey,publicKey:base64url(await crypto.subtle.exportKey('raw',pair.publicKey))};
 const turnstile=document.querySelector('[name="cf-turnstile-response"]')?.value??null;
 const response=await fetch('/auth/pair',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code,public_key:candidate.publicKey,turnstile})});
 const result=await response.json();if(!response.ok)throw new Error(result.error??'Device pairing failed');
 await deviceStorage('write',candidate);device=candidate;
}
async function api(path, body) {
 if(!token||!device)throw new Error('Pair or unlock your owner device first');
 const method=body===undefined?'GET':'POST',raw=body===undefined?'':JSON.stringify(body),timestamp=Math.floor(Date.now()/1000),nonce=crypto.randomUUID();
 const message=JSON.stringify(['owner',method,path,await hash(raw),timestamp,nonce]);
 const signature=base64url(await crypto.subtle.sign('Ed25519',device.privateKey,new TextEncoder().encode(message)));
 const response=await fetch(path,{method,headers:{'Authorization':'Owner '+device.publicKey,'X-Agent-Time':String(timestamp),'X-Agent-Nonce':nonce,'X-Agent-Signature':signature,...(method==='POST'?{'Content-Type':'application/json'}:{})},...(method==='POST'?{body:raw}:{})});
 const result=await response.json();if(!response.ok){const error=new Error(result.error??'Request rejected');error.status=response.status;throw error;}return result;
}
function handler(id, action) {
  byId(id).addEventListener('submit', async event => {
    event.preventDefault();
    try {await action(new FormData(event.target));} catch(error) {status(error.message);}
  });
}
function list(id, values, format) {
  const root = byId(id); root.replaceChildren();
  for (const value of values) {const row = document.createElement('li'); row.textContent = format(value); root.append(row);}
}
async function refresh() {
  const data = await api('/api/snapshot'); owner = data.owner;
  const cards = byId('connectors'); cards.replaceChildren();
  for (const item of data.connectors) {
    const card = document.createElement('div'); card.className = 'card';
    const title = document.createElement('strong'); title.textContent = item.id;
    const badge = document.createElement('span'); badge.className = 'badge'; badge.textContent = item.status;
    card.append(title,badge); cards.append(card);
  }
  if (!data.connectors.length) cards.textContent = 'No connectors. Register a local bridge to start.';
  list('faults',data.faults,item => `${item.connector} / ${item.code} / ${item.severity}: ${item.detail}`);
  list('capabilities',Object.entries(data.capabilities),([name,value]) => `${name}: ${value}`);
  status(`Owner workspace ready · ${data.connectors.length} connectors · ${data.conflicts} sync conflicts`);
  await renderQueue();
}
handler('login', async data => {
  try {await pairDevice(data.get('token')); token='device'; byId('login').reset(); await refresh(); byId('refresh').disabled=false; byId('logout').disabled=false; byId('login-panel').hidden=true;}
  catch(error){token=null;throw error;}
});
byId('logout').addEventListener('click', () => {
  token = null; owner = null; byId('refresh').disabled = true; byId('logout').disabled = true;
  byId('login-panel').hidden = false;
  byId('connectors').textContent = 'Locked'; byId('faults').replaceChildren(); byId('outbox').replaceChildren();
  byId('context-output').textContent = 'Private context cleared';
  byId('summary-output').textContent = ''; byId('context-form').reset(); byId('queue-form').reset(); byId('summary').reset();
  status('Locked. Pending edits remain only in this device’s local queue.');
});
byId('refresh').addEventListener('click', () => refresh().catch(error => status(error.message)));
handler('connector-form', async data => {
  await api('/api/connectors',{connector:data.get('connector'),mode:data.get('mode')}); await refresh();
});
handler('budget', async data => {
  const spec = {kind:'split-budget',amount_minor:integer(data.get('amount')),currency:'USD',buckets:integer(data.get('buckets'))};
  let result;
  if (token && navigator.onLine) result = await api('/api/microapps',spec);
  else {
    if (spec.amount_minor < 0 || spec.buckets < 1 || spec.buckets > 10000) throw new Error('Offline tool needs nonnegative cents and 1–10,000 people');
    const total = BigInt(spec.amount_minor), count = BigInt(spec.buckets), quotient = total/count, remainder = total%count;
    result = {parts_minor:Array.from({length:spec.buckets},(_,position)=>Number(quotient+(BigInt(position)<remainder?1n:0n))),currency:'USD',engine:'offline integer calculation'};
  }
  byId('budget-output').textContent = JSON.stringify(result,null,2);
});
handler('summary', async data => {
  const result = {summary:data.get('text').trim().split(/(?<=[.!?])\s+/).slice(0,2).join(' ')};
  byId('summary-output').textContent = result.summary;
});
handler('context-form', async data => {
  const result = await api('/api/context',{key:data.get('key'),value:JSON.parse(data.get('value')),expected:integer(data.get('expected')),readers:split(data.get('readers')),ttl:null});
  byId('context-output').textContent = JSON.stringify(result,null,2);
  byId('context-form').elements.expected.value = result.version;
});
byId('read-context').addEventListener('click', async () => {
  try {
    const result = await api(`/api/context?key=${encodeURIComponent(new FormData(byId('context-form')).get('key'))}`);
    byId('context-output').textContent = JSON.stringify(result,null,2);
    byId('context-form').elements.expected.value = result.version;
  } catch(error) {status(error.message);}
});
handler('agent-form', async data => {
  const result = await api('/api/agents',{agent:data.get('agent'),public_key:data.get('public_key'),scopes:split(data.get('scopes')),resources:split(data.get('resources'))});
  status(`Agent ${result.agent} registered. Issue a short-lived token through the owner API.`);
});
function database() {
  return new Promise((resolve,reject) => {
    const request = indexedDB.open('one-sovereign-outbox',1);
    request.onupgradeneeded = () => {request.result.createObjectStore('commands',{keyPath:'key'});};
    request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
  });
}
async function store(mode, operation) {
  const db = await database();
  try {return await new Promise((resolve,reject) => {
    const transaction = db.transaction('commands',mode);
    const request = operation(transaction.objectStore('commands')); let result;
    request.onsuccess = () => {result = request.result;};
    transaction.oncomplete = () => resolve(result);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error || new Error('Local transaction aborted'));
  });} finally {db.close();}
}
async function renderQueue() {
  const items = await store('readonly',table => table.getAll());
  const root = byId('outbox'); root.replaceChildren();
  for (const item of items.filter(item=>item.owner===owner)) {
    const row = document.createElement('li'); row.textContent = `${item.record} · ${item.state}`;
    if (item.conflict) {
      for (const [choice,label] of [['remote','Keep remote'],['local','Use device edit']]) {
        const button = document.createElement('button'); button.textContent = label;
        button.addEventListener('click',async()=>{
          try {
            const result = await api('/api/conflicts/resolve',{conflict:item.conflict,choice});
            if (result.resolved) {await store('readwrite',table=>table.delete(item.key)); await renderQueue();}
            status(result.resolved?'Conflict resolved by owner choice.':'Record changed again; review and retry.');
          } catch(error) {status(error.message);}
        }); row.append(button);
      }
    }
    root.append(row);
  }
}
handler('queue-form', async data => {
  if (!owner) throw new Error('Unlock once to identify the owner workspace');
  const command = {owner,key:crypto.randomUUID(),connector:data.get('connector'),record:data.get('record'),expected:integer(data.get('expected')),value:JSON.parse(data.get('value')),state:'pending'};
  await store('readwrite',table => table.add(command)); await renderQueue(); status('Edit saved on this device. No remote write yet.');
});
byId('flush').addEventListener('click', async () => {
  try {
    const commands = await store('readonly',table => table.getAll());
    for (const command of commands) {
      if (command.owner!==owner || command.state!=='pending') continue;
      const {owner:localOwner,state,conflict,...payload} = command;
      const result = await api('/api/sync',payload);
      if (result.status==='applied') await store('readwrite',table=>table.delete(command.key));
      else {command.state=`conflict ${result.conflict}`; command.conflict=result.conflict; await store('readwrite',table=>table.put(command));}
    }
    await renderQueue(); status('Sync checked. Conflicts remain visible for owner resolution.');
  } catch(error) {status(`Queue preserved: ${error.message}`);}
});
for (const button of document.querySelectorAll('[data-mode]')) button.addEventListener('click',()=>{document.body.dataset.mode=button.dataset.mode;});
function network(){byId('network').textContent=navigator.onLine?'Device online · local first':'Offline · local tools and queue available';}
addEventListener('online',network); addEventListener('offline',network); network();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js').catch(()=>{});

(async()=>{
 const setup=new URLSearchParams(location.hash.slice(1)).get('setup');
 if(setup){byId('login').elements.token.value=setup;history.replaceState(null,'',location.pathname);status('Complete the human check, then pair this device.');}
 try{
   device=await deviceStorage('read');
   if(device){token='device';await refresh();byId('refresh').disabled=false;byId('logout').disabled=false;byId('login-panel').hidden=true;}
   const config=await fetch('/api/config').then(r=>r.json());
   if(config.sitekey&&!device){const box=document.createElement('div');box.className='cf-turnstile';box.dataset.sitekey=config.sitekey;byId('human-check').append(box);const script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js';script.async=true;document.head.append(script);}
 }catch(error){token=null;status(error.message);}
})();

let pendingBooking=null,lastRecovery=null;
async function sendBooking(){if(!pendingBooking)return;try{const result=await api('/api/bookings',pendingBooking);pendingBooking=null;byId('booking-retry').hidden=true;byId('booking-result').textContent=JSON.stringify(result,null,2);}catch(error){if(error.status>=400&&error.status<500){pendingBooking=null;byId('booking-retry').hidden=true;}else byId('booking-retry').hidden=false;throw error;}}
handler('cloud-booking',async data=>{if(pendingBooking)throw new Error('Retry the pending reservation before starting another.');const resource=data.get('resource'),start=data.get('start'),end=data.get('end');if(start>=end)throw new Error('Checkout must follow check-in');const fence=await api('/api/booking-fences',{resource});pendingBooking={resource,key:crypto.randomUUID(),range:{start,end},token:fence.token};await sendBooking();});
byId('booking-retry').addEventListener('click',()=>sendBooking().catch(error=>status(error.message)));
handler('cloud-ai',async data=>{if(data.get('consent')!=='on')throw new Error('Explicit AI consent required');const result=await api('/api/ai',{prompt:data.get('prompt')});byId('cloud-result').textContent=JSON.stringify(result,null,2);});
byId('run-recovery').addEventListener('click',async()=>{try{const result=await api('/api/recovery',{key:crypto.randomUUID()});lastRecovery=result.id;byId('cloud-result').textContent=JSON.stringify(result,null,2);}catch(error){status(error.message);}});
byId('recovery-status').addEventListener('click',async()=>{try{if(!lastRecovery)throw new Error('Start a recovery workflow first');byId('cloud-result').textContent=JSON.stringify(await api('/api/recovery?id='+encodeURIComponent(lastRecovery)),null,2);}catch(error){status(error.message);}});
byId('export-data').addEventListener('click',async()=>{try{const result=await api('/api/export'),url=URL.createObjectURL(new Blob([JSON.stringify(result,null,2)],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download='one-hub-private-export.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(error){status(error.message);}});

async function showSwarm(){const result=await api('/api/swarm');byId('swarm-result').textContent=JSON.stringify({healing:result.healing,paused:result.paused,roles:result.roles.map(role=>({id:role.id,paused:role.paused})),recent:result.recent.slice(0,3)},null,2);}
byId('swarm-run').addEventListener('click',async()=>{try{await api('/api/swarm/run',{key:crypto.randomUUID()});await showSwarm();}catch(error){status(error.message);}});
for(const [button,paused] of [['swarm-pause',true],['swarm-resume',false]])byId(button).addEventListener('click',async()=>{try{await api('/api/swarm/control',{role:'*',paused});await showSwarm();}catch(error){status(error.message);}});

const personalCore = document.createElement('section');
personalCore.id = 'personal-core';
personalCore.className = 'panel wide';
personalCore.innerHTML = '<h2>Nathan AI Sovereign Personal Cores</h2><button type="button" id="core-load">Load ZORRO-Cloud agents</button><form id="core-run" hidden><label>Agent<select name="role"></select></label><label>Goal<select name="goal"><option value="assess">Assess evidence</option><option value="recover">Plan recovery</option></select></label><button>Run agent</button></form><div id="core-guards" hidden><button type="button" id="core-pause">Pause all agents</button><button type="button" id="core-resume">Resume all agents</button></div><output id="core-result" aria-live="polite"></output>';
byId('swarm').after(personalCore);
const showCore = result => { byId('core-result').textContent = JSON.stringify(result,null,2); };
byId('core-load').addEventListener('click', async () => {
 try {
  const result = await api('/api/personal-core');
  const form = byId('core-run');
  form.elements.role.replaceChildren(...result.agents.map(agent => new Option(agent.id,agent.id)));
  form.hidden = false;
  byId('core-guards').hidden = false;
  showCore({profile:result.profile,agents:result.agents.length,source_links:result.links.length,guards:result.guards});
 } catch (error) { status(error.message); }
});
handler('core-run',async data=>{
 const result = await api('/api/personal-core/run',{key:crypto.randomUUID(),role:data.get('role'),goal:data.get('goal'),identity:null});
 showCore(result);
});
for (const [button,paused] of [['core-pause',true],['core-resume',false]]) {
 byId(button).addEventListener('click', async () => {
  try { showCore(await api('/api/personal-core/control',{role:'*',paused})); }
  catch (error) { status(error.message); }
 });
}
