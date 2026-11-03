/* Nathan AI Websites / My Desktop — local-only, additive navigation */
(function() {
'use strict';
function init() {
  var index=Array.isArray(window.NathanAIWebsiteModules)?window.NathanAIWebsiteModules:[];
  var search=document.getElementById('search-all'),cards=document.getElementById('module-cards'),status=document.getElementById('result-count'),tabs=document.getElementById('categories'),more=document.getElementById('show-more'),savedNumber=document.getElementById('saved-number');
  var group='all',limit=21;
  function load(key){try{var x=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(x)?x.filter(v=>typeof v==='string'):[];}catch(e){return [];}}
  var saved=load('nathan-websites-saved-v1'),recent=load('nathan-websites-recent-v1');
  function store(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch(e){status.textContent='This browser is not saving locally. Export your list to keep a copy.';}}
  function create(tag,cls,text){var el=document.createElement(tag);if(cls)el.className=cls;if(text)el.textContent=text;return el;}
  function draw() {
    var q=search.value.trim().toLocaleLowerCase();
    var matched=index.filter(function(m){return (group==='all'||m.group===group||(group==='saved'&&saved.includes(m.id))||(group==='recent'&&recent.includes(m.id)))&&(!q||[m.title,m.id,m.group,m.status].join(' ').toLocaleLowerCase().includes(q));});
    if(group==='saved')matched.sort((a,b)=>saved.indexOf(a.id)-saved.indexOf(b.id));
    if(group==='recent')matched.sort((a,b)=>recent.indexOf(a.id)-recent.indexOf(b.id));
    cards.replaceChildren();
    matched.slice(0,limit).forEach(function(m){
      var card=create('article','module');var top=create('div','module-top');var symbol=create('span','symbol',m.group==='games'?'♟':m.group==='creative'?'▥':m.group==='research'?'⌕':m.group==='community'?'✳':'⌘');
      symbol.setAttribute('aria-hidden','true');
      var meta=create('span','meta',m.status);top.append(symbol,meta);
      var h=create('h2','',m.title);var p=create('p','',m.group==='games'?'Game, puzzle or interactive demonstration. Follow the controls and original game instructions.':m.group==='research'?'Source-backed research or archival interface.':m.group==='creative'?'Books, languages, stories, music or creative work.':m.group==='community'?'Independent community-facing website.':'Existing public browser app or development interface. Capabilities vary by module.');
      var acts=create('div','actions');var a=create('a','visit','Open module ↗');a.href=m.url;a.setAttribute('aria-label','Open '+m.title);
      a.addEventListener('click',function(){recent=[m.id].concat(recent.filter(x=>x!==m.id)).slice(0,20);store('nathan-websites-recent-v1',recent);});
      var save=create('button','save',saved.includes(m.id)?'★ Saved':'☆ Save');save.type='button';save.setAttribute('aria-pressed',String(saved.includes(m.id)));save.setAttribute('aria-label',(saved.includes(m.id)?'Remove saved module: ':'Save module: ')+m.title);
      save.addEventListener('click',function(){saved=saved.includes(m.id)?saved.filter(x=>x!==m.id):saved.concat(m.id);store('nathan-websites-saved-v1',saved);draw();});
      acts.append(a,save);card.append(top,h,p,acts);cards.append(card);
    });
    more.hidden=matched.length<=limit;more.textContent='Show more · '+Math.max(0,matched.length-limit)+' remaining';
    savedNumber.textContent=String(saved.length);
    status.textContent=matched.length+' matching public pages · '+Math.min(limit,matched.length)+' shown · '+index.length+' indexed in total.';
    if(!matched.length){var p=create('p','empty','No matching modules. Try another search or choose All.');cards.append(p);}
  }
  tabs.addEventListener('click',function(event){var b=event.target.closest('button[data-group]');if(!b)return;group=b.dataset.group;limit=21;tabs.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));draw();});
  search.addEventListener('input',function(){limit=21;draw();});
  more.addEventListener('click',function(){limit+=21;draw();});
  document.addEventListener('keydown',function(event){if(event.defaultPrevented||event.altKey||event.metaKey)return;var target=event.target;var editing=target&&(target.isContentEditable||/^(INPUT|SELECT|TEXTAREA)$/.test(target.tagName));if((event.ctrlKey&&event.key.toLowerCase()==='k')||(!event.ctrlKey&&!editing&&event.key==='/')){event.preventDefault();search.focus();search.select();}});
  document.getElementById('export').addEventListener('click',function(){var data={schema:'nathan-ai-websites.desktop.v1',saved:saved,recent:recent};var blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});var uri=URL.createObjectURL(blob);var a=create('a');a.href=uri;a.download='Nathan_AI_My_Desktop.json';a.click();setTimeout(function(){URL.revokeObjectURL(uri);},1000);});
  document.getElementById('restore').addEventListener('change',function(event){var file=event.target.files&&event.target.files[0];if(!file)return;if(file.size>1048576){status.textContent='The backup must be smaller than 1 MB.';return;}file.text().then(function(raw){var data=JSON.parse(raw);if(!data||data.schema!=='nathan-ai-websites.desktop.v1'||!Array.isArray(data.saved)||!Array.isArray(data.recent))throw Error('Invalid backup');var known=new Set(index.map(x=>x.id));saved=data.saved.filter(x=>typeof x==='string'&&known.has(x)).slice(0,200);recent=data.recent.filter(x=>typeof x==='string'&&known.has(x)).slice(0,20);store('nathan-websites-saved-v1',saved);store('nathan-websites-recent-v1',recent);draw();}).catch(function(){status.textContent='The file is not a valid Nathan AI My Desktop backup.';}).finally(function(){event.target.value='';});});
  draw();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
