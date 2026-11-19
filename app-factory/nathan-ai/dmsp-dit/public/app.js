
(() => {
'use strict';
const checks=[...document.querySelectorAll('.select-service')];
const cards=[...document.querySelectorAll('.service')];
const selectedCount=document.getElementById('selected-count');
const selectedItems=document.getElementById('selected-items');
const modeDescription=document.getElementById('mode-description');
const search=document.getElementById('service-search');
const results=document.getElementById('results');
const install=document.getElementById('install-app');
const installMessage=document.getElementById('install-message');
let mode='DMSP'; let filter='all'; let promptEvent=null;
const descriptions={
  DMSP:'Outsourced digital managed services for independent customers, subject to an approved contract and service scope.',
  DIT:'A digital IT department for an organization, using the same transparent governance and workflows.',
  CO_MANAGED:'Shared service responsibility between your existing IT team and a digital managed provider.'
};
function selected(){return cards.filter(c=>c.querySelector('input').checked).map(c=>({id:c.dataset.id,name:c.querySelector('h3').textContent,scope:c.querySelector('p').textContent}))}
function update(){
  const data=selected();
  selectedCount.textContent=String(data.length);
  selectedItems.replaceChildren();
  if(!data.length){const m=document.createElement('p');m.textContent='Select departments from the catalog to create your own service plan.';m.className='muted';selectedItems.append(m);}
  else data.forEach(s=>{const x=document.createElement('span');x.className='tag';x.textContent=s.name;selectedItems.append(x)});
  modeDescription.textContent=descriptions[mode];
}
function applyFilter(){
 const term=search.value.trim().toLowerCase();
 let shown=0;
 cards.forEach(c=>{
   const visible=(filter==='all'||c.dataset.group===filter)&&(!term||c.textContent.toLowerCase().includes(term));
   c.classList.toggle('hide',!visible);
   if(visible)shown++;
 });
 results.textContent=shown+' of '+cards.length+' departments shown';
}
checks.forEach(x=>x.addEventListener('change',update));
search.addEventListener('input',applyFilter);
document.querySelectorAll('.filter').forEach(b=>b.addEventListener('click',()=>{
 filter=b.dataset.filter;
 document.querySelectorAll('.filter').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b))});
 applyFilter();
}));
document.querySelectorAll('.mode').forEach(b=>b.addEventListener('click',()=>{
 mode=b.dataset.mode;
 document.querySelectorAll('.mode').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
 update();
}));
document.getElementById('select-all').addEventListener('click',()=>{checks.forEach(x=>x.checked=true);update()});
document.getElementById('clear-all').addEventListener('click',()=>{checks.forEach(x=>x.checked=false);update()});
function save(name,data,mime){
 const file=new Blob([data],{type:mime});
 const url=URL.createObjectURL(file);
 const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),30000);
}
document.getElementById('download-plan').addEventListener('click',()=>{
 const data={product:'Nathan Tabor DMSP + DIT',kind:'service-plan-template',mode,services:selected(),service_count:selected().length,disclaimer:'Planning template only. No account created, no contract signed, no agents installed, and no monitoring activated.'};
 save('nathan-tabor-dmsp-dit-plan.json',JSON.stringify(data,null,2),'application/json');
});
document.getElementById('copy-plan').addEventListener('click',async()=>{
 const text='Nathan Tabor DMSP + DIT | '+mode+'\n'+selected().map(s=>'- '+s.name).join('\n')+'\nPlanning template only — requires approved service agreement and secure onboarding.';
 try{await navigator.clipboard.writeText(text);document.getElementById('copy-plan').textContent='Copied';}
 catch{save('dmsp-dit-plan.txt',text,'text/plain');}
});
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();promptEvent=e;install.hidden=false;});
install.addEventListener('click',async()=>{
 if(promptEvent){promptEvent.prompt();await promptEvent.userChoice;promptEvent=null;}
 else{installMessage.textContent='Use your browser menu: Add to Home Screen (iPhone/iPad) or Install app (supported browsers).';}
});
if('serviceWorker' in navigator && location.protocol==='https:'){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js',{scope:'/'}).catch(()=>{}));}
if(location.protocol==='file:'){installMessage.textContent='This downloaded HTML runs locally. For app installation, open the Cloudflare-hosted version.';}
if(location.protocol!=='file:'){fetch('/healthz',{cache:'no-store'}).then(r=>r.json().then(data=>({ok:r.ok,data}))).then(({ok,data})=>{
 document.getElementById('status').textContent=(ok&&data.database==='reachable')?'Portal database reachable':'Portal health not verified';
}).catch(()=>document.getElementById('status').textContent='Live status unavailable');}
else document.getElementById('status').textContent='Offline standalone copy';
update();applyFilter();
})();
