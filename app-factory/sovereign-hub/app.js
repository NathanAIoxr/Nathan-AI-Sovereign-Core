'use strict';
let token = null;
let owner = null;
const byId = id => document.getElementById(id);
const status = text => { byId('status').textContent = text; };
const split = text => text.split(',').map(part => part.trim()).filter(Boolean);
const integer = raw => {const n = Number(raw); if (!Number.isSafeInteger(n)) throw new Error('Safe integer required'); return n;};
async function api(path, body) {
  if (!token) throw new Error('Unlock the owner session first');
  const response = await fetch(path, {method:body === undefined ? 'GET':'POST', headers:{'Authorization':`Bearer ${token}`,...(body === undefined ? {}:{'Content-Type':'application/json'})}, ...(body === undefined ? {}:{body:JSON.stringify(body)})});
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Request rejected');
  return result;
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
  token = data.get('token'); byId('login').reset();
  try {await refresh(); byId('refresh').disabled = false; byId('logout').disabled = false; byId('login-panel').hidden = true;}
  catch(error) {token = null; throw error;}
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
  const result = await api('/api/edge-summary',{text:data.get('text'),sentences:2});
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
