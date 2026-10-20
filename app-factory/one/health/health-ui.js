/* ONE Health UI: no network requests or third-party scripts. */
(function(){'use strict';
const core=window.ONEHealth, backup=window.TaborVaultBackup;
const $=id=>document.getElementById(id);
const vault=new core.PrivateHealthVault();let initialized=false, busy=false, list=[], url=null;
function status(message,error){$('status').textContent=message;$('status').className=error?'warning':'ok';}
function importStatus(message){$('import-result').textContent=message;}
function locked(){return !vault.key;}
function oneZeroMode(){try{return JSON.parse(localStorage.getItem('one_the_last_app_v1')||'{}').zero===true;}catch{return false;}}
function gated(){if(locked())throw Error('Unlock the private health space first');if(oneZeroMode())throw Error('ONE Zero Mode is active. Turn it off in ONE before changing health data.');if(busy)throw Error('Please wait for the current operation');}
function escapeDownload(blob,name){const link=document.createElement('a'),href=URL.createObjectURL(blob);link.href=href;link.download=name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(href),15000);}
function mime(name){const ext=name.toLowerCase().split('.').pop();return ({png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',pdf:'application/pdf',md:'text/plain',txt:'text/plain',json:'application/json',csv:'text/csv',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'})[ext]||'application/octet-stream';}
function setPrivate(on){$('private-area').hidden=!on;$('lock-btn').disabled=!on;$('unlock-btn').disabled=on;$('passphrase').disabled=on;$('vault-state').textContent=on?'UNLOCKED ON THIS DEVICE':initialized?'LOCKED':'NOT READY';}
async function guard(fn){try{await fn();}catch(err){status(err.message||String(err),true);}}
async function refresh(){list=await vault.list();const originals=list.filter(x=>x.kind==='original');const counts={originals:originals.length,baths:list.filter(x=>x.kind==='bath_formula').length,entries:list.length,bytes:originals.reduce((v,x)=>v+x.size,0)};
 $('stats').replaceChildren();for(const [label,n] of [['Original source files',counts.originals],['Bath formulas',counts.baths],['Timeline & notes',counts.entries-counts.originals-counts.baths],['Original size',Math.round(counts.bytes/1024/1024)+' MB']]){const d=document.createElement('div');d.className='stat';const b=document.createElement('b');b.textContent=String(n);d.append(b,document.createTextNode(label));$('stats').append(d);}
 renderList();
}
function renderList(){const s=$('search').value.trim().toLowerCase(),cat=$('category').value,container=$('files-list');container.replaceChildren();let matches=0;
 for(const x of list){if(cat!=='all'&&x.category!==cat)continue;if(s&&!([x.name,x.path,x.description,x.date,x.category].join(' ').toLowerCase().includes(s)))continue;matches++;
 const node=document.createElement('article');node.className='file';node.setAttribute('role','listitem');
 const main=document.createElement('div');const title=document.createElement('strong');title.textContent=x.name;main.append(title);
 const detail=document.createElement('small');detail.textContent=[x.kind==='original'?'ORIGINAL · SHA-256 '+x.sha256.slice(0,14)+'…':'AUTHOR ENTRY · '+x.kind,x.date||'',x.addedAt?.slice(0,10)||'',x.kind==='original'?Math.round(x.size/1024)+' KB':''].filter(Boolean).join(' · ');main.append(detail);
 if(x.description){const desc=document.createElement('p');desc.className='details';desc.textContent=x.description;main.append(desc);}
 const aside=document.createElement('div');aside.className='actions';if(x.kind==='original'){const sel=document.createElement('select');sel.setAttribute('aria-label','Source category');for(const c of ['Health & Recovery','Bath Systems','Healing & Reflections','Technical & Source Indexes','Unsorted']){const opt=document.createElement('option');opt.value=c;opt.textContent=c;opt.selected=x.category===c;sel.append(opt);}sel.addEventListener('change',()=>guard(async()=>{await vault.updateCategory(x.id,sel.value);await refresh();status('Updated source category. Original bytes unchanged.')}));aside.append(sel);}
 const view=document.createElement('button');view.textContent=x.kind==='original'?'View / download':'View entry';view.addEventListener('click',()=>guard(()=>show(x.id)));aside.append(view);
 node.append(main,aside);container.append(node);
 }
 if(!matches){const p=document.createElement('p');p.textContent='No matching private records. Use the import control or save a new entry.';container.append(p);}
}
async function show(id){const r=await vault.read(id),meta=r.meta,buf=r.content;
 $('preview-title').textContent=meta.name;$('preview-body').replaceChildren();if(url){URL.revokeObjectURL(url);url=null;}
 if(meta.kind==='original'){
  const dl=document.createElement('button');dl.textContent='Download exact original';dl.addEventListener('click',()=>escapeDownload(new Blob([buf],{type:mime(meta.name)}),meta.name));$('preview-body').append(dl);
  const hash=document.createElement('p');hash.className='muted';hash.textContent='SHA-256: '+meta.sha256+' · '+meta.size+' bytes · Imported as original source, not clinically verified.';$('preview-body').append(hash);
  const type=mime(meta.name);if(type.startsWith('text/')||type==='application/json'){const pre=document.createElement('pre');pre.textContent=new TextDecoder().decode(buf).slice(0,200000);$('preview-body').append(pre);}
  if(type.startsWith('image/')){const img=document.createElement('img');img.style.maxWidth='100%';img.style.maxHeight='70vh';img.alt=meta.name;url=URL.createObjectURL(new Blob([buf],{type}));img.src=url;$('preview-body').append(img);}
  if(type==='application/pdf'){const note=document.createElement('p');note.textContent='Use Download exact original to view the PDF in your trusted PDF reader.';$('preview-body').append(note);}
 }else{const pre=document.createElement('pre');pre.textContent=(meta.date?meta.date+'\n\n':'')+(meta.description||'');$('preview-body').append(pre);}
 $('preview').showModal();
}
async function fromLoose(file){if(!core.permitted(file.name))return {skipped:1};const raw=new Uint8Array(await file.arrayBuffer());return {r:await vault.addFile(file.name,raw,file.webkitRelativePath||file.name)};}
async function backupImport(archive){
 let members;try{members=backup.unzipStored(archive);}catch{return null;}
 const raw=members.get('manifest.json');if(!raw)return null;
 let m;try{m=JSON.parse(new TextDecoder().decode(raw));}catch{return null;}
 if(m.schema!=='one.health.portable.v1')return null;
 if(!Array.isArray(m.records)||m.records.length!==members.size-1||m.records.length>500)throw Error('Health backup manifest invalid');
 let added=0,duplicates=0;
 for(const item of m.records){if(!item||!/^files\/[0-9]{5}\.bin$/.test(item.member)||!members.has(item.member))throw Error('Backup source missing');
 const result=await vault.importBackupEntry(item.meta,members.get(item.member));if(result.duplicate)duplicates++;else added++;}
 return {added,duplicates,skipped:0};
}
async function ingest(files,kind){gated();busy=true;let added=0,duplicates=0,skipped=0;
 try{for(const f of files){importStatus('Reading '+f.name+' locally…');if(kind==='zip'){
  const raw=new Uint8Array(await f.arrayBuffer());let outcome=await backupImport(raw);
  if(outcome){added+=outcome.added;duplicates+=outcome.duplicates;continue;}
  const entries=await core.readZip(raw);
  for(const e of entries){const r=await vault.addFile(e.name,e.content,e.path);r.duplicate?duplicates++:added++;}
 }else{const o=await fromLoose(f);if(o.skipped)skipped++;else o.r.duplicate?duplicates++:added++;}}
 await refresh();importStatus('Import complete: '+added+' new originals / entries, '+duplicates+' exact duplicates, '+skipped+' unsupported. Private files were not uploaded.');status('Private sources encrypted and indexed on this device.');
 }finally{busy=false;$('zip-files').value='';$('loose-files').value='';$('folder-files').value='';}
}
async function exportAll(){gated();if(!backup)throw Error('Backup engine unavailable');if(!confirm('Export ALL originals and notes into an UNENCRYPTED ZIP download? Anyone with the ZIP can read the contents.'))return;busy=true;
 try{const all=await vault.list();if(!all.length)throw Error('Nothing to export');const manifest={schema:'one.health.portable.v1',createdAt:new Date().toISOString(),records:[]},entries=[];
  for(let i=0;i<all.length;i++){const x=all[i],r=await vault.read(x.id),member='files/'+String(i+1).padStart(5,'0')+'.bin';manifest.records.push({member,meta:r.meta});entries.push({name:member,bytes:r.content});}
  entries.unshift({name:'manifest.json',bytes:new TextEncoder().encode(JSON.stringify(manifest))});
  const zip=backup.zipStored(entries);escapeDownload(new Blob([zip],{type:'application/zip'}),'ONE_Health_Recovery_Originals_UNENCRYPTED.zip');status('Complete portable ZIP exported. Keep it somewhere private.');
 }finally{busy=false;}
}
async function start(){try{await vault.open();initialized=true;const exists=await vault.exists();setPrivate(false);status(exists?'Enter your private passphrase to unlock saved originals.':'Create a passphrase of 12+ characters. This passphrase cannot be recovered for you.');
 }catch(err){setPrivate(false);$('unlock-btn').disabled=true;status('Secure storage unavailable: '+err.message+'. Import is disabled to avoid unsafe storage.',true);}}
$('unlock-form').addEventListener('submit',e=>{e.preventDefault();guard(async()=>{if(!initialized)throw Error('Storage has not initialized');if(oneZeroMode())throw Error('ONE Zero Mode blocks unlocking or creating a health vault. Switch Zero Mode off in ONE.');const pass=$('passphrase').value;if(await vault.exists())await vault.unlock(pass);else await vault.setup(pass);$('passphrase').value='';setPrivate(true);await refresh();status('Unlocked. Sources are encrypted before persistence.');});});
$('lock-btn').addEventListener('click',()=>{vault.lock();list=[];setPrivate(false);$('files-list').replaceChildren();status('Locked. Passphrase and decryption key cleared from active ONE state.');});
for(const [id,type] of [['zip-files','zip'],['loose-files','loose'],['folder-files','loose']])$(id).addEventListener('change',e=>guard(()=>ingest([...e.target.files],type)));
for(const [id,kind] of [['timeline-form','timeline'],['bath-form','bath_formula']])$(id).addEventListener('submit',e=>{e.preventDefault();guard(async()=>{gated();const form=e.target,fd=new FormData(form);await vault.addEntry(kind,fd.get('title'),fd.get('details'),fd.get('date'));form.reset();await refresh();status('New authored entry saved privately, without changing existing sources.');});});
$('category').addEventListener('change',renderList);$('search').addEventListener('input',renderList);
$('export-btn').addEventListener('click',()=>guard(exportAll));
$('clear-btn').addEventListener('click',()=>guard(async()=>{gated();if(!confirm('Erase ALL private health records on this browser? Export and verify a backup first.'))return;if(!confirm('Final confirmation: permanently erase encrypted originals and notes in this local vault?'))return;await vault.clear();await refresh();status('All ONE Health records on this browser erased. Original external files were not touched.');}));
$('preview-close').addEventListener('click',()=>$('preview').close());
$('preview').addEventListener('close',()=>{if(url){URL.revokeObjectURL(url);url=null;}});
start();
})();