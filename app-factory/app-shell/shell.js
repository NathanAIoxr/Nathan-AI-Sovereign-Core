'use strict';
const $=id=>document.getElementById(id),el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n};
let apps=[],themes=[],current=null,records=[],mode='preview',editing=null,creating=false,requestVersion=0,applying=false,appearanceSave=null;
const api=async(route,method='GET',body)=>{const r=await fetch('/api/'+route,{method,headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});const data=await r.json();if(!r.ok)throw Error(data.error||'Request failed');return data};
const message=text=>{$('message').textContent=text};
function controls(){for(const id of ['configure','new-record','theme','export'])$(id).disabled=!current||(mode!=='sqlite'&&id!=='export');$('register').disabled=mode!=='sqlite';$('logout').hidden=mode!=='sqlite'}
async function select(id){
 const version=++requestVersion;current=apps.find(a=>a.id===id);if(!current)return;records=[];message('');
 history.replaceState(null,'','#'+encodeURIComponent(id));
 for(const b of $('apps').children)b.setAttribute('aria-current',b.dataset.app===id?'page':'false');
 $('app-id').textContent='ONE / '+current.id.toUpperCase();$('app-name').textContent=current.name;$('app-description').textContent=current.description;$('summary-app').textContent=current.name;
 applying=true;try{window.NathanAppearanceUI.setState(current.appearance)}finally{applying=false}$('theme').value=current.appearance.skin;$('summary-theme').textContent=themes.find(t=>t.id===current.appearance.skin)?.name||current.appearance.skin;
 $('open-app').hidden=false;$('open-app').href=new URL('../../'+current.entry,location.href).href;
 controls();render();
 if(mode==='sqlite'){try{const data=await api('apps/'+id+'/records');if(version!==requestVersion)return;records=data.items;render();$('records-help').textContent='Saved in SQLite · isolated to '+current.name+' · latest '+data.limit+' records'}catch(e){if(version===requestVersion)message(e.message)}}
 else $('records-help').textContent='Read-only GitHub Pages preview. Start the included backend to save app settings and records.';
}
function nav(){const root=$('apps');root.replaceChildren();for(const a of apps){const b=el('button',a.name);b.type='button';b.dataset.app=a.id;b.onclick=()=>select(a.id);root.append(b)}}
function render(){
 $('summary-count').textContent=records.length;const root=$('records');root.replaceChildren();const q=$('search').value.toLowerCase();
 for(const row of records.filter(r=>JSON.stringify(r.data).toLowerCase().includes(q))){
  const card=el('article');card.className='record';
  for(const f of current.fields){const p=el('p');p.append(el('small',f.label+': '),document.createTextNode(String(row.data[f.key]??'—')));card.append(p)}
  const actions=el('div');actions.className='actions';const edit=el('button','Edit');edit.onclick=()=>openRecord(row);const del=el('button','Delete');del.className='secondary';del.onclick=async()=>{if(!confirm('Delete this record?'))return;try{await api('apps/'+current.id+'/records/'+row.id,'DELETE');await select(current.id)}catch(e){message(e.message)}};actions.append(edit,del);card.append(actions);root.append(card);
 }
 if(!root.children.length)root.append(el('p',q?'No matching records.':'No records yet. Your app is ready.'));
}
function openRecord(row=null){editing=row;$('editor-title').textContent=row?'Edit record':'Add record';$('fields').replaceChildren();for(const f of current.fields){const lab=el('label',f.label),input=el(f.type==='text'&&f.key==='notes'?'textarea':'input');input.name=f.key;if(input.tagName==='INPUT')input.type=f.type==='boolean'?'checkbox':f.type==='number'?'number':'text';if(f.type==='number')input.step='any';if(f.type==='boolean')input.checked=Boolean(row?.data[f.key]);else input.value=row?.data[f.key]??'';lab.append(input);$('fields').append(lab)}$('editor').showModal()}
$('new-record').onclick=()=>openRecord();$('cancel-record').onclick=()=>$('editor').close();$('search').oninput=render;
$('record-form').onsubmit=async e=>{e.preventDefault();const data={};for(const f of current.fields){const input=e.target.elements.namedItem(f.key);if(f.type==='number'&&input.value==='')continue;data[f.key]=f.type==='boolean'?input.checked:f.type==='number'?Number(input.value):input.value}try{await api('apps/'+current.id+'/records'+(editing?'/'+editing.id:''),editing?'PUT':'POST',data);$('editor').close();await select(current.id)}catch(e){message(e.message)}};
$('theme').onchange=async()=>{const id=current.id,old=current.appearance;try{const a=await api('apps/'+id,'PUT',{...current,appearance:{...old,skin:$('theme').value}});apps=apps.map(x=>x.id===id?a:x);await select(id);message('Theme saved to the database.')}catch(e){$('theme').value=old.skin;message(e.message)}};
function configure(create){creating=create;$('manifest-error').textContent='';$('manifest').value=JSON.stringify(create?{id:'my-app',name:'My App',description:'My application workspace',entry:'app-factory/nathan-ai/index.html',appearance:{...window.NathanAppearance.defaults,skin:'midnight'},fields:[{key:'title',label:'Title',type:'text'},{key:'notes',label:'Notes',type:'text'}]}:current,null,2);$('manifest-dialog').showModal()}
$('configure').onclick=()=>configure(false);$('register').onclick=()=>configure(true);$('cancel-manifest').onclick=()=>$('manifest-dialog').close();
$('manifest-form').onsubmit=async e=>{e.preventDefault();try{const data=JSON.parse($('manifest').value),saved=await api(creating?'apps':'apps/'+current.id,creating?'POST':'PUT',data);$('manifest-dialog').close();await boot(saved.id)}catch(e){$('manifest-error').textContent=e.message}};
$('login-form').onsubmit=async e=>{e.preventDefault();try{await api('session','POST',{token:$('token').value});$('token').value='';await boot()}catch(e){message(e.message)}};
$('logout').onclick=async()=>{try{await api('session','DELETE');location.reload()}catch(e){message(e.message)}};
$('export').onclick=()=>{const blob=new Blob([JSON.stringify({schema:'one.app-records.v1',app:current,records},null,2)],{type:'application/json'});const a=el('a');a.href=URL.createObjectURL(blob);a.download=current.id+'-records.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
async function boot(preferred){
 try{const r=await fetch('/api/bootstrap');if(r.status===401){$('login').hidden=false;mode='locked';$('connection').textContent='Database locked';controls();return}if(!r.ok)throw Error('Backend unavailable');const data=await r.json();if(data.mode!=='sqlite')throw Error('No backend');apps=data.apps;themes=data.themes;mode='sqlite';$('login').hidden=true;$('connection').textContent='SQLite connected'}
 catch{try{const r=await fetch('seed.json');if(!r.ok)throw Error('App catalog unavailable');apps=(await r.json()).apps;themes=window.NathanAppearance.skins;mode='preview';$('connection').textContent='Read-only preview';message('Start the included server for database-backed themes and records.')}catch(e){message(e.message);return}}
 $('theme').replaceChildren();for(const t of themes){const o=el('option',t.name);o.value=t.id;$('theme').append(o)}nav();let hash='';try{hash=decodeURIComponent(location.hash.slice(1))}catch{}await select(preferred||apps.find(a=>a.id===hash)?.id||apps[0]?.id);
}
window.addEventListener('nathan:appearancechange',event=>{
 if(applying||mode!=='sqlite'||!current)return;
 const id=current.id,appearance=window.NathanAppearance.settings(event.detail);
 current={...current,appearance};apps=apps.map(a=>a.id===id?current:a);
 $('theme').value=appearance.skin;$('summary-theme').textContent=themes.find(t=>t.id===appearance.skin)?.name||appearance.skin;
 clearTimeout(appearanceSave);const manifest={...current};
 appearanceSave=setTimeout(async()=>{try{await api('apps/'+id,'PUT',manifest);message('Appearance saved to the database.')}catch(e){message('Appearance could not be saved: '+e.message)}},250);
});
boot();
