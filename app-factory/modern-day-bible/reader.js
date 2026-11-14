'use strict';
const $=id=>document.getElementById(id),node=(tag,text)=>{const e=document.createElement(tag);e.textContent=text;return e};
let sources=[],active=null,connected=false,selection=0;
async function request(route,method='GET',body){const r=await fetch('/api/'+route,{method,headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});if(r.status===401)throw Error('Connect the private database through ONE App Shell first.');if(!r.ok)throw Error((await r.json()).error||'Unable to read the database');return r.json()}
function renderList(){
 const rows=window.OneStoryLibrary.search(sources,$('query').value,$('kind').value),out=$('sources');out.replaceChildren();$('count').textContent=rows.length+' OF '+sources.length+' SOURCES';
 for(const source of rows){const b=node('button',source.title);b.setAttribute('aria-current',String(source.id===active));b.append(node('small',source.kind+' · '+source.text.length.toLocaleString()+' characters'+(source.complete?'':' · INCOMPLETE')));b.onclick=()=>open(source);out.append(b)}
 if(!rows.length)out.append(node('p','No matching sources.'));return rows;
}
async function open(source){
 const current=++selection;active=source.id;renderList();$('title').textContent=source.title;$('metadata').textContent=source.kind+' · '+source.text.length.toLocaleString()+' characters · checking integrity…';$('scope').textContent=source.scope;
 $('original').hidden=!source.source.startsWith('https:');if(!$('original').hidden)$('original').href=source.source;
 $('text').replaceChildren();const q=$('query').value.trim(),text=source.text;
 if(q){let at=0,found=0;const lower=text.toLocaleLowerCase(),needle=q.toLocaleLowerCase();let index;while((index=lower.indexOf(needle,at))!==-1&&found++<1000){$('text').append(document.createTextNode(text.slice(at,index)),node('mark',text.slice(index,index+q.length)));at=index+q.length}$('text').append(document.createTextNode(text.slice(at)))}else $('text').textContent=text;
 try{const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))).map(n=>n.toString(16).padStart(2,'0')).join('');if(current!==selection)return;$('metadata').textContent=source.kind+' · '+text.length.toLocaleString()+' characters · '+(source.complete&&hash===source.sha256?'full text integrity verified':'INCOMPLETE OR CHANGED — review source')}catch{if(current===selection)$('metadata').textContent='Integrity check unavailable in this browser. Source text retained.'}
}
async function load(){
 try{
  const [app,result]=await Promise.all([request('apps/modern-day-bible'),(async()=>{const items=[];let offset=0;do{const page=await request('apps/modern-day-bible/records?offset='+offset);items.push(...page.items);offset=page.nextOffset;if(items.length>100000)throw Error('Collection exceeds reader limit')}while(offset!==null&&offset!==undefined);return {items}})()]);connected=true;window.NathanAppearanceUI.setState(app.appearance);sources=window.OneStoryLibrary.assemble(result.items);
  $('connection').textContent='Private SQLite · connected';$('coverage').textContent='Related-source collection. These imported sources are not confirmed as the recent Modern Day Bible project. The Scriptures & 007 item is an index, not a complete scripture corpus.';
  $('import').disabled=false;$('export').disabled=!sources.length;$('connect').hidden=true;const rows=renderList();if(rows.length)await open(rows.find(s=>s.id===active)||rows[0]);
 }catch(e){connected=false;$('connection').textContent='Private database required';$('coverage').textContent='Story text stays in the private database. This public app does not contain your manuscripts.';$('status').textContent=e.message;$('connect').hidden=false;renderList()}
}
$('query').oninput=()=>{const rows=renderList();if(rows.length)open(rows.find(s=>s.id===active)||rows[0]);else{$('title').textContent='No matching sources';$('text').textContent='';$('metadata').textContent='';$('scope').textContent='';$('original').hidden=true}};
$('kind').onchange=$('query').oninput;$('import').onclick=()=>$('file').click();
$('file').onchange=async()=>{const file=$('file').files[0];if(!file||!connected)return;try{if(file.size>8*1024*1024)throw Error('Import exceeds 8 MB');const bytes=new Uint8Array(await file.arrayBuffer()),text=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bytes);let originalBytes='';if(!file.name.toLowerCase().endsWith('.json'))for(const byte of bytes)originalBytes+=String.fromCharCode(byte);const bundle=file.name.toLowerCase().endsWith('.json')?JSON.parse(text.replace(/^\uFEFF/,'')):{schema:'one.story-sources.v1',sources:[{id:'owner-'+crypto.randomUUID(),title:file.name.replace(/\.(txt|md)$/i,''),url:'local:upload/'+encodeURIComponent(file.name),kind:'story',scope:'Added directly by the owner to this collection.',text,original:{format:'text/plain',base64:btoa(originalBytes)}}]};const result=await request('story-import','POST',bundle);await load();$('status').textContent=result.imported+' sources imported; '+result.skipped+' unchanged sources skipped.'}catch(e){$('status').textContent=e.message}finally{$('file').value=''}};
$('export').onclick=async()=>{try{const bundle=await request('story-export'),a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(bundle,null,2)],{type:'application/json'}));a.download='modern-day-bible-related-sources.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}catch(e){$('status').textContent=e.message}};
load();
