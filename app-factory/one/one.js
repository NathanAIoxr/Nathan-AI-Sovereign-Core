/* ONE — The Last App | by Nathan Tabor
 * Local-first, deterministic PWA prototype.
 * NO provider credentials, real bank transfers, cross-app control, scraping or background automation.
 * Only built-in local notes/tasks/calendar and user-opened HTTPS destinations function.
 */
(function(root) {
'use strict';
const KEY='one_the_last_app_v1';
const ATOZ=[
['A','Accounts & Identity','key-round','Password managers and identities'],
['B','Banking & Bills','wallet','Payments, subscriptions and budgeting'],
['C','Calendar & Commitments','calendar-days','Appointments, tasks, reminders'],
['D','Documents & Data','files','Notes, files and cloud storage'],
['E','Exercise & Health','heart-pulse','Activity, healthcare and wellness'],
['F','Family & Contacts','users-round','People, groups, trusted connections'],
['G','Groceries & Home','house','Shopping and domestic routines'],
['H','Habits & Routines','repeat','Personal routines and habits'],
['I','Information & Search','search','Unified information discovery'],
['J','Jobs & Work','briefcase-business','Projects, messages, meetings'],
['K','Knowledge & Learning','book-open','Courses, research and libraries'],
['L','Location & Travel','map','Directions, travel, trips'],
['M','Media & Music','play','Video, music, podcasts and photographs'],
['N','Notifications & Signals','bell','Optional notification digests'],
['O','Organization & Systems','folders','Boards, records and planning'],
['P','Privacy & Permissions','shield-check','Scopes, expiry, revocation'],
['Q','Quick Actions','zap','One DO bar for approved commands'],
['R','Relationships & Social','messages-square','Social accounts and calls'],
['S','Security & Safety','lock','Backups, alerts and recovery'],
['T','Time & Focus','clock','Timers, focus, time tracking'],
['U','Utilities','scan-line','Calculator, scanner and recorder'],
['V','Vision & Goals','target','Projects, progress, milestones'],
['W','Wealth & Assets','landmark','Property, financial overview'],
['X','Experiments','flask-conical','Isolated trials and test workflows'],
['Y','You & Preferences','user-round','Themes, control and personal profile'],
['Z','Zero Mode','power','Silence only the actions ONE controls']
];
const DIVISIONS=[
{code:101,name:'Zero-UI & Frontend',description:'Dashboard, DO command bar, iOS/Android accessibility, widgets, on-device state'},
{code:201,name:'Orchestration & Connectors',description:'Provider adapters, official OAuth grants, user-approved cross-service actions'},
{code:301,name:'Unified Private Vault',description:'User-controlled assets, indexing, source versioning, deduplication and portability'},
{code:401,name:'Workflows & Event Processing',description:'Explicit triggers, queues, idempotency, rollback and scheduled flow runners'},
{code:501,name:'Cloud & Edge Infrastructure',description:'Secure API, tenant separation, backups, logs, budgets and regional processing'},
{code:601,name:'Identity & Consent Guard',description:'Passkeys, encrypted tokens on secure backend, time-scoped grants and revoke'},
{code:701,name:'Payments & Account Ledger',description:'Read-only finance first, approved payments through regulated connectors'},
{code:801,name:'Intent & Routing Engine',description:'Local parsing, provider-selection policy, risk-based confirmations, no silent execution'},
{code:901,name:'Native OS & Hardware Bridge',description:'Supported platform APIs, foreground intents, Bluetooth/Health with explicit scope'}
];
const PROVIDERS=[
{key:'apple-calendar',title:'Apple Calendar',domain:'C',method:'Native EventKit',support:'native-planned',description:'System event access in signed iOS app, user-approved calendars'},
{key:'google-calendar',title:'Google Calendar',domain:'C',method:'OAuth + Calendar API',support:'oauth-planned',description:'Separate provider authorization required'},
{key:'contacts',title:'Contacts',domain:'F',method:'Native Contacts permission',support:'native-planned',description:'No access available to this website'},
{key:'reminders',title:'Apple Reminders',domain:'C',method:'EventKit Reminders',support:'native-planned',description:'Needs native app and user consent'},
{key:'healthkit',title:'Apple Health',domain:'E',method:'Native HealthKit',support:'native-planned',description:'Per-type read/share authorization and purpose strings'},
{key:'health-connect',title:'Android Health Connect',domain:'E',method:'Health Connect APIs',support:'native-planned',description:'Native Android and type-specific grants'},
{key:'icloud-drive',title:'iCloud Drive / Files',domain:'D',method:'User document picker',support:'manual-ready',description:'Manual import of user-chosen files is available through Creator Vault'},
{key:'google-drive',title:'Google Drive',domain:'D',method:'OAuth + Drive API',support:'oauth-planned',description:'No broad or silent Drive account scan'},
{key:'microsoft-365',title:'Microsoft 365 / OneDrive',domain:'J',method:'Microsoft Graph + OAuth',support:'oauth-planned',description:'Per-resource delegated scopes'},
{key:'gmail',title:'Gmail',domain:'J',method:'OAuth + Gmail API',support:'oauth-planned',description:'Read/compose only after user grants scope'},
{key:'outlook',title:'Outlook',domain:'J',method:'Microsoft Graph + OAuth',support:'oauth-planned',description:'No mail access connected yet'},
{key:'github',title:'GitHub',domain:'J',method:'GitHub App + installation permissions',support:'oauth-planned',description:'Scoped repos and audit logs'},
{key:'finance',title:'Banking / Open Banking',domain:'B',method:'Regulated provider APIs',support:'regulated-planned',description:'No hidden proxies, direct account transfers or stored bank passwords'},
{key:'smart-home',title:'Smart Home',domain:'G',method:'Matter/HomeKit/Home APIs',support:'native-planned',description:'Authorized controls only, no arbitrary device access'},
{key:'media',title:'Music & Streaming',domain:'M',method:'Official provider SDK/APIs',support:'oauth-planned',description:'Playback/catalog capabilities differ by service'},
{key:'maps',title:'Maps & Navigation',domain:'L',method:'User initiated app/site link',support:'open-link',url:'https://maps.apple.com/',description:'Opens Apple Maps; no background navigation control'},
{key:'shortcuts',title:'Apple Shortcuts',domain:'Q',method:'App Intents + user Shortcuts',support:'native-planned',description:'Actions must be exposed and authorized'},
{key:'factory',title:'TABOR 1-2-3 FACTORY',domain:'V',method:'Local navigation to existing Factory',support:'open-link',url:'../index.html',description:'Open Factory project tools'},
{key:'vault',title:'Factory Universal Creator Vault',domain:'D',method:'Local navigation',support:'open-link',url:'../vault.html',description:'Manual file/media import and reuse'}
];
const ROOT_SCHEMA='tabor123.one.v1';
const safe=x=>String(x??'').trim().slice(0,500);
function initial(){
 return {schema:ROOT_SCHEMA,version:1,createdAt:new Date().toISOString(),activeDomain:'all',zero:false,
   prefs:{quiet:false,workOnly:false,localOnly:true},grants:{},tasks:[],notes:[],events:[],log:[],flows:[
   {id:'morning',name:'Morning',steps:[{type:'show',domain:'C'},{type:'show',domain:'G'},{type:'show',domain:'J'}]},
   {id:'work',name:'Work',steps:[{type:'show',domain:'J'},{type:'show',domain:'O'},{type:'show',domain:'T'}]},
   {id:'sleep',name:'Sleep',steps:[{type:'setting',key:'quiet',value:true},{type:'show',domain:'H'}]}
 ]};
}
let data=initial();
function load(){try{const loaded=JSON.parse(localStorage.getItem(KEY)||'null');if(loaded&&loaded.schema===ROOT_SCHEMA&&loaded.version===1){data={...initial(),...loaded};data.grants=loaded.grants||{};data.tasks=Array.isArray(loaded.tasks)?loaded.tasks:[];data.notes=Array.isArray(loaded.notes)?loaded.notes:[];data.events=Array.isArray(loaded.events)?loaded.events:[];data.log=Array.isArray(loaded.log)?loaded.log:[]}}catch(e){}}
function persist(){localStorage.setItem(KEY,JSON.stringify(data))}
function audit(type,message){data.log.unshift({at:new Date().toISOString(),type,message:safe(message)});data.log=data.log.slice(0,100);persist()}
function uid(){return typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():'ONE-'+Date.now()+'-'+Math.random().toString(36).slice(2)}
function addTask(title){title=safe(title);if(!title)return {ok:false,message:'Please enter a task.'};data.tasks.unshift({id:uid(),title,done:false,createdAt:new Date().toISOString()});audit('task','Created '+title);return {ok:true,message:'Task saved locally.'}}
function addNote(text){text=safe(text);if(!text)return {ok:false,message:'Please enter a note.'};data.notes.unshift({id:uid(),text,createdAt:new Date().toISOString()});audit('note','Saved note locally');return {ok:true,message:'Note saved locally.'}}
function addEvent(title,date){title=safe(title);if(!title||!date)return {ok:false,message:'Enter a title and date.'};if(!/^\d{4}-\d\d-\d\d$/.test(date)||!Number.isFinite(Date.parse(date+'T12:00:00')))return {ok:false,message:'Select a valid date.'};data.events.unshift({id:uid(),title,date});audit('event','Created local event '+title);return {ok:true,message:'Event saved to ONE only (not Apple Calendar).'}}
function resolveIntent(raw){
 const input=safe(raw).replace(/\s+/g,' '),lower=input.toLowerCase();
 if(!input)return {kind:'empty',message:'Enter an instruction.'};
 let m;
 if((m=input.match(/^(?:add (?:a )?task|todo|to-do|remind me to)\s+(.+)$/i)))return {kind:'task',label:'Create a task in ONE',value:m[1]};
 if((m=input.match(/^(?:note|remember|save note)\s+(.+)$/i)))return {kind:'note',label:'Save a private note in ONE',value:m[1]};
 if((m=input.match(/^(?:open)\s+(.+)$/i)))return {kind:'open',label:'Open a connected destination',value:m[1]};
 if((m=input.match(/^(?:show|go to)\s+(.+)$/i)))return {kind:'domain',label:'Display ONE domain',value:m[1]};
 if(/^(?:run|start)\s+(morning|work|sleep)$/i.test(input))return {kind:'flow',label:'Run an on-device local flow',value:input.split(/\s+/).slice(1).join(' ').toLowerCase()};
 if(/^(?:zero mode|turn on zero mode|zero on)$/i.test(input))return {kind:'zero',label:'Activate ONE Zero Mode',value:true};
 if(/^(?:zero off|disable zero mode|turn off zero mode)$/i.test(input))return {kind:'zero',label:'Deactivate ONE Zero Mode',value:false};
 if(/^(?:list tasks|show tasks)$/i.test(input))return {kind:'view',label:'Show local tasks',value:'tasks'};
 if(lower.includes('pay ')||lower.includes('transfer ')||lower.includes('book ')||lower.includes('order ')||lower.includes('send '))return {kind:'unsupported',message:'ONE can prepare a plan for this request but is not connected to a transaction provider. No charge, booking, payment or message will be sent.'};
 return {kind:'unsupported',message:'This request needs a connected service or native capability. No external action was taken.'};
}
function findDomain(text){const v=safe(text).toLowerCase();return ATOZ.find(([c,t])=>c.toLowerCase()===v||t.toLowerCase()===v||t.toLowerCase().startsWith(v))?.[0]}
function executeIntent(intent){
 if(data.zero&&!['zero','view'].includes(intent.kind))return {ok:false,message:'Zero Mode blocks actions inside ONE. Deactivate it to continue.'};
 if(intent.kind==='task')return addTask(intent.value);
 if(intent.kind==='note')return addNote(intent.value);
 if(intent.kind==='zero'){data.zero=Boolean(intent.value);audit('privacy',data.zero?'Zero Mode on':'Zero Mode off');return {ok:true,message:data.zero?'Zero Mode enabled for ONE. Device-wide apps and alerts are not disabled.':'Zero Mode disabled.'}}
 if(intent.kind==='view')return {ok:true,view:'tasks',message:'Showing tasks.'};
 if(intent.kind==='flow')return runFlow(intent.value);
 if(intent.kind==='domain'){const code=findDomain(intent.value);if(!code)return {ok:false,message:'Unknown domain. Try its letter A–Z.'};data.activeDomain=code;persist();return {ok:true,view:'home',message:'Opened '+code+' domain.'}}
 if(intent.kind==='open'){const text=intent.value.toLowerCase();const p=PROVIDERS.find(p=>p.key===text||p.title.toLowerCase()===text);if(!p||p.support!=='open-link')return {ok:false,message:'No authorized openable destination for '+intent.value+'. Connect it first where supported.'};return {ok:true,open:p.url,message:'Opening '+p.title+' by user action. ONE is not controlling that app.'}}
 return {ok:false,message:intent.message||'No action performed.'};
}
function runFlow(name){
 const flow=data.flows.find(f=>f.id===name);
 if(!flow)return {ok:false,message:'No such flow.'};
 if(data.zero)return {ok:false,message:'Zero Mode blocks flows.'};
 const actions=[];
 for(const step of flow.steps){
  if(step.type==='setting'&&step.key==='quiet'){data.prefs.quiet=Boolean(step.value);actions.push('ONE quiet preference updated')}
  if(step.type==='show'){data.activeDomain=step.domain;actions.push('ONE domain '+step.domain+' highlighted')}
 }
 audit('flow',flow.name+' flow ran locally');
 return {ok:true,message:flow.name+' local flow completed: '+actions.join('; ')+'. External apps were not controlled.'};
}
function grantProvider(key,mode,expiry){
 const p=PROVIDERS.find(x=>x.key===key);if(!p)return {ok:false,message:'Unknown provider'};
 if(!['ignored','read','action'].includes(mode))return {ok:false,message:'Choose a valid mode.'};
 if(mode==='ignored'){delete data.grants[key];audit('grant','Ignored '+p.title);return {ok:true,message:p.title+' ignored in ONE.'}}
 if(p.support==='open-link'||p.support==='manual-ready')return {ok:false,message:p.title+' does not use an OAuth authorization grant in this prototype. Use Open instead.'};
 return {ok:false,message:'Consent preference can be planned here, but '+p.title+' cannot connect until the native/API adapter and genuine OAuth flow are installed. No grant was claimed or saved.'};
}
function exportData(){return JSON.stringify(data,null,2)}
function clearData(){localStorage.removeItem(KEY);data=initial();persist()}
const ONE={ATOZ,DIVISIONS,PROVIDERS,resolveIntent,executeIntent,runFlow,grantProvider,addTask,addNote,addEvent,exportData,clearData,initial,get state(){return data},get KEY(){return KEY}};
root.ONEEngine=ONE;
if(typeof document==='undefined'||!document.getElementById('one-domains'))return;
const $=id=>document.getElementById(id);
function el(tag,txt,cls){const x=document.createElement(tag);if(txt!==undefined)x.textContent=String(txt);if(cls)x.className=cls;return x}
function status(t){$('one-status').textContent=t}
function urlOpen(url){if(url.startsWith('../')||url.startsWith('https://'))window.location.assign(url)}
function nav(name){document.querySelectorAll('[data-page]').forEach(p=>p.hidden=p.dataset.page!==name);document.querySelectorAll('[data-view]').forEach(b=>{b.setAttribute('aria-current',b.dataset.view===name?'page':'false')});}
function showStats(){const display=[['Connections',Object.keys(data.grants).length],['Tasks',data.tasks.filter(t=>!t.done).length],['Notes',data.notes.length],['Events',data.events.length]];$('one-stats').replaceChildren();display.forEach(([name,n])=>{const card=el('div',undefined,'stat');card.append(el('strong',n),el('small',name));$('one-stats').append(card)})}
function paintDomains(){
 const list=$('one-domains');list.replaceChildren();
 const chosen=data.activeDomain;
 for(const [letter,title,,description] of ATOZ){const b=el('button',undefined,'domain'+(chosen===letter?' selected':''));b.append(el('strong',letter),el('span',title),el('small',description));b.onclick=()=>{if(data.zero){status('Zero Mode is on. Turn it off to use other modules.');return}data.activeDomain=letter;persist();paintDomains();status(title+': module is currently a control tile. Connect or use a local function as it becomes available.')};list.append(b)}
 $('one-zero').textContent=data.zero?'Zero Mode: ON':'Zero Mode: OFF';
 $('one-zero').setAttribute('aria-pressed',String(data.zero));
 $('one-zero').classList.toggle('enabled',data.zero);
}
function paintItems(){
 const l=$('one-items');l.replaceChildren();
 data.tasks.forEach(t=>{const line=el('div',undefined,'item');const cb=document.createElement('input');cb.type='checkbox';cb.checked=!!t.done;cb.setAttribute('aria-label','Completed '+t.title);cb.onchange=()=>{t.done=cb.checked;audit('task',(cb.checked?'Completed ':'Reopened ')+t.title);paint()};line.append(cb,el('span',t.title),el('small','Task'));l.append(line)});
 data.notes.forEach(n=>{const line=el('div',undefined,'item');line.append(el('span',n.text),el('small','Note'));l.append(line)});
 data.events.forEach(v=>{const line=el('div',undefined,'item');line.append(el('span',v.title),el('small',v.date));l.append(line)});
 if(!l.children.length)l.append(el('p','No local items yet. Use the DO bar or the forms below.'));
}
function paintConnections(){
 const box=$('one-providers');box.replaceChildren();
 PROVIDERS.forEach(p=>{
  const card=el('div',undefined,'connector');const h=el('div',undefined,'between');h.append(el('strong',p.title),el('small',p.support==='open-link'?'Openable':'Not connected'));card.append(h,el('p',p.description),el('small',p.method));const actions=el('div',undefined,'row');
  const b=el('button',p.support==='open-link'?'Open destination':p.support==='manual-ready'?'Open Vault':'Connection details');
  b.onclick=()=>{if(data.zero){status('Zero Mode blocks outgoing actions.');return}if(p.support==='open-link')urlOpen(p.url);else if(p.support==='manual-ready')urlOpen('../vault.html');else status(p.title+' needs a genuine, scoped native/API connection. No personal data were accessed.')};
  actions.append(b);const select=document.createElement('select');select.setAttribute('aria-label','Requested access mode for '+p.title);for(const mode of ['ignored','read','action']){const o=el('option',mode==='ignored'?'Ignore':mode==='read'?'Read-only':'Allow approved actions');o.value=mode;select.append(o)}select.value='ignored';select.onchange=()=>{const r=grantProvider(p.key,select.value);status(r.message);select.value='ignored'};if(!['open-link','manual-ready'].includes(p.support))actions.append(select);
  card.append(actions);box.append(card)
 });
}
function paintFlows(){const box=$('one-flows');box.replaceChildren();data.flows.forEach(f=>{const b=el('button',f.name,'flow');b.onclick=()=>{status(runFlow(f.id).message);paint()};box.append(b)})}
function paintLog(){const log=$('one-log');log.replaceChildren();data.log.slice(0,20).forEach(x=>{const item=el('div',undefined,'log');item.append(el('small',new Date(x.at).toLocaleString()),el('p',x.message));log.append(item)});if(!data.log.length)log.append(el('p','No actions yet.'))}
function paint(){showStats();paintDomains();paintItems();paintConnections();paintFlows();paintLog();$('one-quiet').checked=!!data.prefs.quiet}
function act(raw){const result=executeIntent(resolveIntent(raw));status(result.message);if(result.open)urlOpen(result.open);if(result.view==='tasks')nav('items');paint()}
load();paint();
$('one-do-form').onsubmit=e=>{e.preventDefault();act($('one-do').value);$('one-do').value=''};
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>nav(b.dataset.view));
$('one-zero').onclick=()=>{act(data.zero?'zero off':'zero on')};
$('one-task-form').onsubmit=e=>{e.preventDefault();status(addTask($('one-task').value).message);$('one-task').value='';paint()};
$('one-note-form').onsubmit=e=>{e.preventDefault();status(addNote($('one-note').value).message);$('one-note').value='';paint()};
$('one-event-form').onsubmit=e=>{e.preventDefault();status(addEvent($('one-event').value,$('one-date').value).message);$('one-event').value='';paint()};
$('one-quiet').onchange=()=>{data.prefs.quiet=$('one-quiet').checked;audit('privacy','ONE quiet preference set to '+data.prefs.quiet);status('ONE preference saved. iOS/Android notifications have not been changed.')};
$('one-export').onclick=()=>{const blob=new Blob([exportData()],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='one-local-data.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000)};
$('one-delete').onclick=()=>{if(confirm('Erase all ONE local tasks, notes, events, and preferences on this browser?')){clearData();paint();status('ONE local data cleared. Other apps were not touched.')}};
$('one-help').onclick=()=>{$('one-help-panel').hidden=!$('one-help-panel').hidden};
nav('home');
})(typeof globalThis!=='undefined'?globalThis:this);
