/* Public metadata reader + opt-in private source display; no private upload */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const create=(tag,contents,cls)=>{
 const node=document.createElement(tag);
 if(contents!==undefined)node.textContent=String(contents);
 if(cls)node.className=cls;
 return node;
};
const lengthLimit=524288;
const moduleList=['NT-CORE-001','NT-SOUL-001','NT-HEART-001'];
let index=null,privatePack=null;
function card(label,title,body,hdr){
 const c=create('article',undefined,'card');
 c.append(create('small',label),create('h3',title));
 if(body)c.append(create('p',body));
 if(hdr){const a=create('a','Open related module');a.href=hdr;c.append(a);}
 return c;
}
function limitFilter(v){return String(v||'').trim().toLocaleLowerCase()}
function setupKind(id,values){
 const box=$(id);
 for(const kind of [...new Set(values)].sort()){
  const opt=create('option',kind.replaceAll('_',' '));opt.value=kind;box.append(opt);
 }
}
function drawTopics(){
 const q=limitFilter($('topic-query').value),kind=$('kind').value;
 const rows=index.topics.filter(r=>(!kind||r.kind===kind)&&limitFilter(r.title+' '+r.summary+' '+r.origin+' '+r.module_ids.join(' ')).includes(q));
 $('topic-grid').replaceChildren(...rows.map(r=>card(r.kind,r.title,r.summary,'#modules')));
 $('topic-status').textContent=rows.length+' of '+index.topics.length+' topic groupings. Original sources are separate from these summaries.';
}
function drawModules(){
 const q=limitFilter($('module-query').value),stage=$('stage').value;
 const rows=index.modules.filter(r=>(!stage||r.stage===stage)&&limitFilter(r.id+' '+r.name+' '+r.stage).includes(q));
 $('module-grid').replaceChildren(...rows.map(r=>card(r.id+' · '+r.stage,r.name,r.source)));
 $('module-status').textContent=rows.length+' of '+index.modules.length+' preserved module reference positions.';
}
function loadIndex(d){
 if(!d||d.schema!=='nathan-ai.absolute-intelligence-atlas.v1'||!Array.isArray(d.modules)||d.modules.length!==54||!Array.isArray(d.topics))throw Error('Unexpected source registry format');
 index=d;
 $('topic-count').textContent=d.topics.length;
 setupKind('kind',d.topics.map(x=>x.kind));
 setupKind('stage',d.modules.map(x=>x.stage));
 drawTopics();drawModules();
 $('link-grid').replaceChildren(...d.links.map(x=>card(x.stage,x.name,'Opens an existing browser module or source-entry door.',x.href)));
}
function importPack(obj){
 if(!obj||obj.schema!=='nathan-ai.totality.owner-pack.v1'||!Array.isArray(obj.originals)||obj.originals.length>120||obj.originals.some(x=>!x||typeof x.text!=='string'||typeof x.id!=='string'||x.text.length>25000))throw Error('This is not an approved NATHAN AI Totality owner source pack.');
 privatePack=obj;
 const items=obj.originals.map(o=>{
  const el=create('article',undefined,'panel');
  el.append(create('p',o.origin||'OWNER-SUPPLIED ORIGINAL','kicker'),create('h3',o.label||o.id));
  const pre=create('blockquote',o.text,'claim');el.append(pre);
  el.append(create('p','Original source display only. Exact wording has not been normalized or fact-checked.'));
  return el;
 });
 $('source-grid').replaceChildren(...items);
 $('source-status').textContent=items.length+' owner-supplied original entries loaded in this browser session, no upload or persistent save.';
}
function init(){
 $('topic-query').addEventListener('input',()=>{if(index)drawTopics()});
 $('kind').addEventListener('change',()=>{if(index)drawTopics()});
 $('module-query').addEventListener('input',()=>{if(index)drawModules()});
 $('stage').addEventListener('change',()=>{if(index)drawModules()});
 $('owner-pack').addEventListener('change',async()=>{
  const f=$('owner-pack').files&&$('owner-pack').files[0];
  if(!f)return;
  try{
   if(f.size>lengthLimit)throw Error('File exceeds 512 KiB; do not import an entire master archive here.');
   const raw=await f.text();
   importPack(JSON.parse(raw));
  }catch(e){$('source-status').textContent='Original import not completed: '+e.message}
  finally{$('owner-pack').value=''}
 });
 $('clear').addEventListener('click',()=>{privatePack=null;$('source-grid').replaceChildren();$('source-status').textContent='Owner originals cleared from this browser page.'});
 fetch('./registry.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Unable to retrieve same-origin public registry');return r.json()}).then(loadIndex).catch(e=>{$('topic-status').textContent='Unable to load registry: '+e.message;$('module-status').textContent='Open the public JSON link below or try reloading.';});
}
init();
})();
