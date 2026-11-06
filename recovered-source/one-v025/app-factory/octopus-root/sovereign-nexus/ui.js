/* Local-only Sovereign Nexus controls — user-selected preview → explicit approved graft. */
(()=>{'use strict';
const N=window.SovereignNexus,R=window.OctopusRoot;
const adapters={root:R,field:window.SovereignFieldRoot,uct:window.UniversalContinuumRoot,continuum:window.SovereignContinuum,bubble:window.SovereignBubble,codex:window.TaborRootCodex};
const $=id=>document.getElementById(id);let pending=null;
const message=(id,s)=>{$(id).textContent=String(s||'')};
if(!N||!R||Object.values(adapters).some(x=>!x)){message('message','One or more local Root engines are missing. Nexus cannot attach anything.');$('preview').disabled=true;$('commit').disabled=true;return}
function getSnapshot(){
 const raw=localStorage.getItem(N.KEY);
 const state=raw===null?R.create():JSON.parse(raw);
 N.precheck(R,state);
 return {raw,state};
}
function createMetric(target,label,value){const box=document.createElement('div');box.className='metric';box.textContent=label;const strong=document.createElement('strong');strong.textContent=String(value);box.append(strong);target.append(box)}
function metrics(id,records){const target=$(id);target.replaceChildren();for(const [name,value] of records)createMetric(target,name,value)}
function inspect(){
 try{const {state}=getSnapshot();
  metrics('stats',[['ROOT NODES',state.nodes.length],['KNOWLEDGE LINKS',state.edges.length],['CRUMB REAPER REVIEWS',state.cookie.length],['FREE RECEPTORS',R.LIMIT-state.nodes.length]]);
  const token=localStorage.getItem(N.BACKUP_KEY);
  message('recoveryStatus',token?'A local Nexus rollback snapshot is present. You may undo only if the Root still matches its receipt.':'No Nexus rollback snapshot in this browser.');
 }catch(e){metrics('stats',[]);message('message','Unable to validate the current Root: '+e.message)}}
function renderPacks(){
 const host=$('packs');host.replaceChildren();
 for(const p of N.PACKS){
  const lab=document.createElement('label');lab.className='pack';
  const check=document.createElement('input');check.type='checkbox';check.value=p.id;check.name='nexus-pack';
  check.addEventListener('change',invalidate);
  const meta=document.createElement('div'),title=document.createElement('span'),desc=document.createElement('small'),ns=document.createElement('code');
  title.className='pack-title';title.textContent=p.name;desc.textContent=p.description;ns.textContent='Namespace: '+p.namespace+':';meta.append(title,desc,ns);
  lab.append(check,meta);host.append(lab);
 }
}
function renderDirectory(){
 const query=$('search').value.trim().toLowerCase(),host=$('directory');host.replaceChildren();
 const visible=N.MODULES.filter(m=>!query||[m.name,m.category,m.description].join(' ').toLowerCase().includes(query));
 for(const mod of visible){const link=document.createElement('a');link.href=mod.href;link.className='module';const name=document.createElement('strong'),category=document.createElement('small'),description=document.createElement('span');name.textContent=mod.name;category.textContent=mod.category;description.textContent=mod.description;link.append(name,category,description);host.append(link)}
 if(!visible.length){const text=document.createElement('p');text.textContent='No matching modules.';host.append(text)}
}
function chosen(){return Array.from(document.querySelectorAll('input[name="nexus-pack"]:checked')).map(x=>x.value)}
function invalidate(){pending=null;$('previewPanel').hidden=true;$('approve').checked=false;$('commit').disabled=true;}
function preview(){
 try{const {state}=getSnapshot();const result=N.prepare(R,state,adapters,chosen());pending=result;
  metrics('previewMetrics',[['ADDED NODES',result.addedNodes],['ADDED LINKS',result.addedLinks],['BEFORE',result.before.nodes+' nodes'],['AFTER',result.after.nodes+' nodes'],['RETAINED REVIEWS',result.after.reviews],['COMPARISON LINKS',result.crosslinks]]);
  const host=$('details');host.replaceChildren();
  for(const p of result.summary){const line=document.createElement('div');line.className='summary';const label=document.createElement('strong');label.textContent=p.name;line.append(label,document.createTextNode(' · '+p.newNodes+' nodes · '+p.newLinks+' links'));host.append(line)}
  const note=document.createElement('p');note.className='muted';note.textContent='No account or data-sharing rights granted. Preview hash: '+result.beforeFingerprint+' → '+result.afterFingerprint;host.append(note);
  $('previewPanel').hidden=false;$('approve').checked=false;$('commit').disabled=true;
  message('message',result.addedNodes===0&&result.addedLinks===0?'All selected packs are already attached; the preview makes no changes.':'PREVIEW READY — no Root changes have been saved. Review the exact proposed graft.');
 }catch(e){invalidate();message('message','Preview blocked; nothing written. '+e.message)}
}
function download(name,text){
 const blob=new Blob([text],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);
}
function commit(){
 if(!pending||!$('approve').checked){message('message','Explicit approval and a current preview are required.');return}
 const already=localStorage.getItem(N.BACKUP_KEY);
 if(already&&!confirm('A prior Nexus rollback snapshot exists. Replace it with a new pre-graft backup? Export the previous Root backup first if needed.'))return;
 try{
  const before=getSnapshot(),result=N.apply(R,before.state,adapters,pending);
  if(result.addedNodes===0&&result.addedLinks===0){message('message','Nothing new to attach. Your Root was not changed.');invalidate();return}
  const receipt=N.receipt(result);
  // Atomic within the logic of this page: write a backup FIRST; if this fails, never touch Root.
  const backup={schema:'tabor.sovereign-nexus.rollback.v1',rawBefore:before.raw,receipt};
  localStorage.setItem(N.BACKUP_KEY,JSON.stringify(backup));
  try{localStorage.setItem(N.KEY,R.save(result.state))}
  catch(err){if(before.raw===null)localStorage.removeItem(N.KEY);else localStorage.setItem(N.KEY,before.raw);throw err}
  message('message','ATTACHED ✓ '+result.addedNodes+' new nodes and '+result.addedLinks+' knowledge links. Old nodes, reviews, saves, and apps were not deleted.');
  invalidate();inspect();
 }catch(e){message('message','Graft failed or Root changed. No approved connection was applied: '+e.message);invalidate();}
}
function undo(){
 let payload;try{const raw=localStorage.getItem(N.BACKUP_KEY);if(!raw)throw Error('No previous Nexus snapshot available.');payload=JSON.parse(raw);
  if(payload.schema!=='tabor.sovereign-nexus.rollback.v1')throw Error('Unknown backup format');
  const current=getSnapshot();
  const backup=payload.rawBefore===null?R.create():JSON.parse(payload.rawBefore);
  N.precheck(R,backup);
  N.verifyRollback(current.state,backup,payload.receipt);
  if(!confirm('Undo the last Nexus graft? This restores the exact previous Root snapshot only if nothing changed since.'))return;
  if(payload.rawBefore===null)localStorage.removeItem(N.KEY);else localStorage.setItem(N.KEY,payload.rawBefore);
  localStorage.removeItem(N.BACKUP_KEY);
  invalidate();inspect();message('recoveryStatus','Previous Root snapshot restored. No other app saves were modified.');
 }catch(e){message('recoveryStatus','Safe undo refused: '+e.message+'. Export your current Root and reconcile changes manually.')}
}
function exportRoot(){try{const {state}=getSnapshot();download('sovereign-octopus-root-backup.json',R.save(state));message('message','Root backup exported without changing the graph.')}catch(e){message('message','Export blocked: '+e.message)}}
function exportReceipt(){try{const value=localStorage.getItem(N.BACKUP_KEY);if(!value)throw Error('No local Nexus graft receipt.');const data=JSON.parse(value);download('nexus-graft-receipt.json',JSON.stringify(data.receipt,null,2));message('recoveryStatus','Local receipt exported; it is an audit reference, not an identity credential.')}catch(e){message('recoveryStatus',e.message)}}
$('preview').onclick=preview;$('clear').onclick=()=>{for(const box of document.querySelectorAll('input[name="nexus-pack"]'))box.checked=false;invalidate();message('message','All pack choices cleared. No connections applied.')};
$('approve').onchange=()=>{$('commit').disabled=!pending||!$('approve').checked};
$('commit').onclick=commit;$('cancel').onclick=()=>{invalidate();message('message','Preview canceled. The Root remains unchanged.')};
$('inspect').onclick=inspect;$('export').onclick=exportRoot;$('undo').onclick=undo;$('exportReceipt').onclick=exportReceipt;
$('search').addEventListener('input',renderDirectory);
renderPacks();renderDirectory();inspect();
})();