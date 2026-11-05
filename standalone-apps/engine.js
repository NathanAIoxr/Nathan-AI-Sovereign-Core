/* NATHAN AI — source-preserving standalone GitHub entry points.
 * Pages embed originals at their existing paths: no code duplication,
 * source rewriting, private file access, or automatic model requests.
 */
(function(){'use strict';
const script=document.currentScript;
const repoRoot=new URL('../',script.src),catalogUrl=new URL('catalog.json',script.src);
const $=id=>document.getElementById(id);
const text=(tag,value,cls)=>{const el=document.createElement(tag);if(value!==undefined)el.textContent=String(value);if(cls)el.className=cls;return el};
const okPath=p=>typeof p==='string'&&p.length<=260&&/^(?:app-factory\/|archive-index\/|index\.html$)/.test(p)&&!p.includes('..')&&!/[\\?#:%\x00-\x1f]/.test(p)&&p.endsWith('.html');
const okStandalone=p=>typeof p==='string'&&p.startsWith('standalone-apps/')&&p.endsWith('/index.html')&&!p.includes('..')&&!/[\\?#:%\x00-\x1f]/.test(p);
const icon={apps:'▣',games:'♟',creative:'✎',research:'⌕',community:'✳'};
const groupNames={apps:'Apps',games:'Games',creative:'Creative & Books',research:'Research & Education',community:'Community'};
function url(path){if(!okPath(path))throw Error('Source path rejected');return new URL(path,repoRoot).href}
function launchChat(row){
 if(!row||!okPath(row.sourcePath))return;
 const packet={schema:'nathan-ai.standalone-context.v1',id:String(row.id).slice(0,300),
   title:String(row.title).slice(0,240),sourcePath:row.sourcePath,
   category:String(row.category).slice(0,24),containsPrivateText:false,modelRequestSent:false};
 try{
  sessionStorage.setItem('nathan-ai.standalone-context.v1',JSON.stringify(packet));
  location.assign(new URL('app-factory/nathan-ai/hop-in/chatbox/',repoRoot).href);
 }catch(e){
  const target=$('status')||$('launch-status');if(target)target.textContent='Browser session storage unavailable; open HOP IN directly and enter the program title.';
 }
}
function initLanding(){
 const source=document.body.dataset.source||'',name=document.body.dataset.name||'Original program',group=document.body.dataset.group||'apps',sourceSha=document.body.dataset.sha||'',id=document.body.dataset.catalogId||'';
 const active=$('program-title'),frame=$('program-frame'),open=$('open-original'),github=$('open-source'),chat=$('ask-chatbox'),back=$('catalog-back');
 if(!okPath(source)){const status=$('launch-status');if(status)status.textContent='This route is not a valid local application source.';return}
 if(active)active.textContent=name;
 document.title=name+' · Nathan AI Standalone';
 if(frame){frame.src=url(source);frame.title='Embedded original source: '+name}
 if(open){open.href=url(source);open.target='_blank';open.rel='noopener noreferrer'}
 if(github){github.href='https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/blob/main/'+source;github.target='_blank';github.rel='noopener noreferrer'}
 if(back)back.href=new URL('standalone-apps/',repoRoot).href;
 if(chat)chat.addEventListener('click',()=>launchChat({id,title:name,sourcePath:source,category:group}));
 const family=$('source-family');if(family)family.textContent=groupNames[group]||group;
 const sha=$('original-sha');if(sha)sha.textContent='Original source blob at audit: '+sourceSha;
 const status=$('launch-status');if(status)status.textContent='Original program loaded from its unchanged repository path. This is a separate GitHub launch address, not an independent offline installation.';
}
let records=[],visible=30,activeGroup='all',query='';
function draw(){
 const rows=records.filter(x=>(activeGroup==='all'||x.category===activeGroup)&&(!query||[x.title,x.sourcePath,x.category,x.status].join(' ').toLocaleLowerCase().includes(query)));
 const container=$('programs');container.replaceChildren();
 for(const p of rows.slice(0,visible)){
  const card=text('article',undefined,'program'),type=text('div',(icon[p.category]||'▣')+' '+(groupNames[p.category]||p.category),'type');
  const title=text('h2',p.title),path=text('p',p.sourcePath,'path'),state=text('p',p.status,'state');
  const links=text('div',undefined,'links'),standalone=text('a','Launch standalone'),original=text('a','Open original');
  standalone.href=new URL(p.standalonePath,repoRoot).href;
  original.href=url(p.sourcePath);original.target='_blank';original.rel='noopener noreferrer';
  links.append(standalone,original);card.append(type,title,path,state,links);container.append(card);
 }
 const count=$('count');count.textContent=rows.length+' matching standalone entry pages · '+Math.min(rows.length,visible)+' shown · '+records.length+' total';
 const more=$('more');more.hidden=rows.length<=visible;
}
async function initCatalog(){
 const status=$('status');
 try{
  const res=await fetch(catalogUrl,{credentials:'same-origin',cache:'no-store'});if(!res.ok)throw Error('Standalone catalog unavailable');
  const doc=await res.json();if(doc.schema!=='nathan-ai.standalone-apps.v1'||!Array.isArray(doc.entries)||doc.entries.length>300)throw Error('Invalid standalone catalog');
  const paths=new Set(),ids=new Set();
  records=doc.entries.filter(x=>{
   if(!x||!okPath(x.sourcePath)||!okStandalone(x.standalonePath)||typeof x.title!=='string'||!x.title||!Object.hasOwn(groupNames,x.category)||ids.has(x.id)||paths.has(x.standalonePath))return false;
   ids.add(x.id);paths.add(x.standalonePath);return true;
  });
  $('total').textContent=String(records.length);
  $('registry-counts').textContent=doc.sourceCounts.websites+' website listings + '+doc.sourceCounts.workspaceApps+' app listings, with shared records counted once.';
  const search=$('search'),group=$('group'),more=$('more');
  search.addEventListener('input',()=>{query=search.value.trim().toLocaleLowerCase();visible=30;draw()});
  group.addEventListener('change',()=>{activeGroup=group.value;visible=30;draw()});
  more.addEventListener('click',()=>{visible+=30;draw()});
  draw();status.textContent='Public-only directory loaded. No original program files have been moved or rewritten.';
 }catch(e){status.textContent='Unable to load the standalone index: '+e.message}
}
if(document.body.dataset.page==='catalog')initCatalog();else if(document.body.dataset.page==='standalone')initLanding();
})();