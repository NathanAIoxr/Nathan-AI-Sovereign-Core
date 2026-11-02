/* NATHAN AI Innocence Studio: source-first browser interactions, no server writes */
(()=>{'use strict';
const g=window.InnocenceGeometry;
if(!g)return;
const $=id=>document.getElementById(id);
let phase='rose',wheelCount=2,owner=null,imgUrl=null;
const MAX_JSON=100*1024,MAX_IMAGE=12*1024*1024;
const node=(tag,value,cls)=>{
 const n=document.createElement(tag);
 if(value!==undefined)n.textContent=String(value);
 if(cls)n.className=cls;
 return n;
};
function render(){
 const spin=Number($('spin').value);
 $('degrees').textContent=spin+'°';
 phase=$('stage').value;
 $('stage-note').textContent=g.STAGES.find(s=>s.id===phase).detail;
 // The SVG originates only from the controlled, fixed geometry engine.
 $('figure').innerHTML=g.buildSVG({stage:phase,spin,guides:$('guides').checked});
 $('vehicle').innerHTML=g.wheelsSVG(wheelCount);
 $('two').setAttribute('aria-pressed',String(wheelCount===2));
 $('four').setAttribute('aria-pressed',String(wheelCount===4));
}
function download(data,filename,type){
 const blob=new Blob([data],{type});
 const u=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=u;a.download=filename;document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(u),2000);
}
function addField(label,value){
 const c=node('article',undefined,'card');
 c.append(node('small',label),node('p',value||'(source field empty)'));
 return c;
}
async function digest(v){
 if(!globalThis.crypto?.subtle)return 'digest unavailable in this browser';
 const bytes=new TextEncoder().encode(v);
 const hex=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(b=>b.toString(16).padStart(2,'0')).join('');
 return hex;
}
function drawOwner(){
 const profile=owner.data?.mother_profile;
 const reply=owner.data?.protagonist_rebuttal;
 const rows=[];
 if(profile){
  for(const [k,v]of Object.entries(profile))rows.push(addField('MOTHER PROFILE / '+k,v));
 }
 if(reply){
  for(const k of ['core_premise','theological_blind_spot'])if(k in reply)rows.push(addField('PROTAGONIST REBUTTAL / '+k,reply[k]));
 }
 if(owner.data?.narrative_action)rows.push(addField('NARRATIVE ACTION',owner.data.narrative_action));
 if(!rows.length)rows.push(addField('SOURCE ONLY','Original Python preserved. Import the matching owner JSON pack to display individual scene fields.'));
 $('fields').replaceChildren(...rows);
 $('verses').replaceChildren(...(Array.isArray(reply?.scriptural_evidence)?reply.scriptural_evidence:g.SCRIPTURE).map(v=>addField('AUTHOR SCRIPTURAL EXHIBIT',v)));
 $('python-source').textContent=owner.code;
 $('narrative').hidden=false;
}
function exportOutline(){
 if(!owner)return;
 const data=owner.data;
 let output='# NATHAN AI 🚀 · NOVEL CONFLICT LAB — DERIVED STUDY NOTES\n\n';
 output+='Status: derived from owner-selected source, not original code. All allegations remain attributed narrative claims; not independent findings.\n\n';
 output+='Source SHA-256: '+(owner.sha||'not supplied')+'\n\n';
 if(data){
  for(const [label,part] of [['MOTHER PROFILE',data.mother_profile],['PROTAGONIST REBUTTAL',data.protagonist_rebuttal]]){
   output+='## '+label+'\n\n';
   if(part)for(const [k,v]of Object.entries(part)){output+='**'+k+'**\n\n';output+=(Array.isArray(v)?v.map(x=>'- '+x).join('\n'):v)+'\n\n'}
  }
  output+='## NARRATIVE ACTION\n\n'+(data.narrative_action||'')+'\n\n';
 }else output+='## Imported raw Python\n\nThe original is preserved separately. This preview has not interpreted the Python syntax.\n\n';
 output+='## Related scriptural source references\n\n'+g.SCRIPTURE.map(x=>'- '+x).join('\n')+'\n\n';
 output+='## Separate engineering canon\n\nThe Cross → THE HOOKED CROSS → Rose of Sharon → 13-fold wheel → iris & Ezekiel-inspired visual study.\n';
 download(output,'nathan-ai-novel-conflict-derived-notes.md','text/markdown;charset=utf-8');
}
async function loadOwner(file){
 if(file.size>MAX_JSON)throw Error('Source exceeds 100 KiB owner-import limit.');
 if(file.name.toLowerCase().endsWith('.py')){
  const code=await file.text();
  owner={code,data:null,sha:await digest(code)};
  $('import-status').textContent='Original Python loaded read-only. Source SHA-256: '+owner.sha+'. JSON pack needed for structured fields.';
  drawOwner();
  return;
 }
 const obj=JSON.parse(await file.text());
 if(!obj||obj.schema!=='nathan-ai.innocence.owner-pack.v1'||typeof obj.original_python_source!=='string'||obj.original_python_source.length>90000||!obj.novel_scene_data||typeof obj.novel_scene_data!=='object'||Array.isArray(obj.novel_scene_data))throw Error('Not a valid NATHAN AI owner source pack.');
 const got=await digest(obj.original_python_source);
 if(obj.source_sha256&&got!=='digest unavailable in this browser'&&got!==obj.source_sha256)throw Error('Original code digest differs from pack; source integrity check failed.');
 owner={code:obj.original_python_source,data:obj.novel_scene_data,sha:obj.source_sha256||got};
 $('import-status').textContent='Owner source imported locally. Original SHA-256: '+owner.sha+'. No automatic storage or publishing.';
 drawOwner();
}
function init(){
 $('author-quote').textContent=g.SYMBOL;
 $('stage').addEventListener('change',render);
 $('spin').addEventListener('input',render);
 $('guides').addEventListener('change',render);
 $('previous').addEventListener('click',()=>{const i=g.STAGES.findIndex(s=>s.id===phase);$('stage').value=g.STAGES[Math.max(0,i-1)].id;render()});
 $('next').addEventListener('click',()=>{const i=g.STAGES.findIndex(s=>s.id===phase);$('stage').value=g.STAGES[Math.min(g.STAGES.length-1,i+1)].id;render()});
 $('two').addEventListener('click',()=>{wheelCount=2;render()});
 $('four').addEventListener('click',()=>{wheelCount=4;render()});
 $('export-svg').addEventListener('click',()=>download(g.buildSVG({stage:phase,spin:Number($('spin').value),guides:$('guides').checked,size:1200}),'nathan-ai-'+phase+'-13-fold.svg','image/svg+xml;charset=utf-8'));
 $('novel-pack').addEventListener('change',async()=>{
  const file=$('novel-pack').files?.[0];if(!file)return;
  try{await loadOwner(file)}
  catch(e){$('import-status').textContent='Source import rejected: '+e.message}
  finally{$('novel-pack').value=''}
 });
 $('download-source').addEventListener('click',()=>{if(owner)download(owner.code,'novel_outline.py','text/x-python;charset=utf-8')});
 $('download-outline').addEventListener('click',exportOutline);
 $('clear-novel').addEventListener('click',()=>{owner=null;$('fields').replaceChildren();$('verses').replaceChildren();$('python-source').textContent='';$('narrative').hidden=true;$('import-status').textContent='Owner source cleared from this page.'});
 $('art-file').addEventListener('change',()=>{
  const f=$('art-file').files?.[0];if(!f)return;
  if(f.size>MAX_IMAGE||!['image/png','image/jpeg','image/webp'].includes(f.type)){$('art-status').textContent='Only PNG/JPEG/WebP images up to 12 MB are accepted.';$('art-file').value='';return}
  if(imgUrl)URL.revokeObjectURL(imgUrl);
  imgUrl=URL.createObjectURL(f);
  $('art-preview').src=imgUrl;$('art-name').textContent=f.name;
  $('artbox').hidden=false;$('art-status').textContent='Displaying owner-selected artwork only on this device; no upload.';
  $('art-file').value='';
 });
 $('clear-art').addEventListener('click',()=>{if(imgUrl)URL.revokeObjectURL(imgUrl);imgUrl=null;$('art-preview').removeAttribute('src');$('artbox').hidden=true;$('art-status').textContent='Artwork cleared.'});
 window.addEventListener('beforeunload',()=>{if(imgUrl)URL.revokeObjectURL(imgUrl)});
 render();
}
init();
})();