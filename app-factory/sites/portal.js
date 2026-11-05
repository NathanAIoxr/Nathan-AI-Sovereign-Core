
(function(){
'use strict';
var sites=Array.isArray(window.NathanIndependentSites)?window.NathanIndependentSites:[];
var sourceApps=Array.isArray(window.NathanAIWebsiteModules)?window.NathanAIWebsiteModules:[];
// The nine independent studios already have their own cards: preserve original
// registry entries, but do not render each again as a second app card.
var consolidated=window.NathanDirectoryConsolidator.consolidate(sites,sourceApps);
var apps=consolidated.apps;
var publicPageCount=document.getElementById('public-page-count');
if(publicPageCount)publicPageCount.textContent=String(apps.length);
var siteCards=document.getElementById('site-cards'),directory=document.getElementById('directory-cards');
var search=document.getElementById('search'),summary=document.getElementById('result-summary'),more=document.getElementById('more'),filter='all',limit=21,concepts=[],gameRecords=[];
function make(tag,cls,label){var e=document.createElement(tag);if(cls)e.className=cls;if(label!==undefined)e.textContent=label;return e;}
sites.forEach(function(site){
 var card=make('article','site-card'),symbol=make('span','symbol',site.icon),chip=make('span','chip','Independent studio'),title=make('h3','',site.title),p=make('p','',site.summary),a=make('a','','Open website ↗');
 symbol.setAttribute('aria-hidden','true');a.href='./'+site.slug+'/';a.setAttribute('aria-label','Open '+site.title);card.append(symbol,chip,title,p,a);siteCards.append(card);
});
var all=[];
sites.forEach(function(site){all.push({id:'site:'+site.slug,title:site.title,type:'sites',status:'New browser-local studio',href:'./'+site.slug+'/',summary:site.summary});});
apps.forEach(function(m){if(!m||!m.id||!m.title)return;all.push({id:'app:'+m.id,title:m.title,type:m.group==='games'?'games':m.group==='creative'?'creative':m.group==='research'?'research':m.group==='community'?'community':'apps',status:m.status||'Public page',href:'../'+m.id,summary:'Existing original public module · '+m.group});});
function render(){
 var q=search.value.trim().toLocaleLowerCase();
 var rows=all.concat(concepts,gameRecords).filter(function(m){return(filter==='all'||m.type===filter)&&(!q||[m.title,m.summary,m.status,m.type].join(' ').toLocaleLowerCase().includes(q));});
 directory.replaceChildren();
 rows.slice(0,limit).forEach(function(m){
 var card=make('article','entry'),head=make('div','head'),type=make('small','',m.type),state=make('small','',m.status),title=make('strong','',m.title),p=make('p','',m.summary);
 head.append(type,state);card.append(head,title,p);if(m.href){var a=make('a','','Open ↗');a.href=m.href;a.setAttribute('aria-label','Open '+m.title);card.append(a);}else card.append(make('span','no-link','Catalog only · Source not published'));directory.append(card);
 });
 more.hidden=rows.length<=limit;more.textContent='Show more ('+Math.max(0,rows.length-limit)+' remaining)';
 summary.textContent=rows.length+' matching records · '+Math.min(rows.length,limit)+' shown · '+sites.length+' new site studios, '+apps.length+' existing public pages'+(concepts.length?', '+concepts.length+' catalog-only design records':'')+(gameRecords.length?', '+gameRecords.length+' game title records':'');
 if(rows.length===0)directory.append(make('p','empty','No results. Try a different search or choose All.'));
}
document.getElementById('filters').addEventListener('click',function(event){var target=event.target.closest('button[data-type]');if(!target)return;filter=target.dataset.type;limit=21;document.querySelectorAll('button[data-type]').forEach(function(b){b.setAttribute('aria-pressed',String(b===target));});render();});
search.addEventListener('input',function(){limit=21;render();});more.addEventListener('click',function(){limit+=21;render();});
document.getElementById('load-catalog').addEventListener('click',function(){
 var button=this;button.disabled=true;button.textContent='Loading public records…';
 fetch('../products.json',{credentials:'same-origin'}).then(function(res){if(!res.ok)throw Error('Catalog unavailable');return res.json();}).then(function(data){
  if(!Array.isArray(data.products))throw Error('Invalid catalog');
  concepts=data.products.filter(function(x){return x&&['concept','private-prototype'].includes(x.status);}).map(function(x){
   return{id:'product:'+x.id,title:x.name,type:'concepts',status:x.status==='private-prototype'?'Documented private prototype':'Documented concept',href:null,summary:String(x.summary||'Public title only').slice(0,220)};
  });
  button.textContent='Public concept records loaded';
  render();
 }).catch(function(){button.disabled=false;button.textContent='Retry loading public concept records';summary.textContent='Could not open the existing public products registry. Existing pages are still available.';});
});

document.getElementById('load-games').addEventListener('click',function(){
 var button=this;button.disabled=true;button.textContent='Loading game title records…';
 fetch('../nathan-ai/games/catalog.json',{credentials:'same-origin'}).then(function(res){if(!res.ok)throw Error('Game catalog unavailable');return res.json();}).then(function(data){
  if(!Array.isArray(data.entries))throw Error('Invalid game catalog');
  function localPublicHref(entry){
   if(entry.stage!=='browser-demo'||typeof entry.href!=='string')return null;
   var parts=['nathan-ai','games'];
   for(var seg of entry.href.split('/')){
    if(seg==='.'||seg==='')continue;
    if(seg==='..'){if(!parts.length)return null;parts.pop();}
    else parts.push(seg);
   }
   if(!parts.length||!(/\.html$/i.test(parts[parts.length-1])))return null;
   return '../'+parts.join('/');
  }
  gameRecords=data.entries.filter(function(e){return e&&typeof e.title==='string';}).map(function(e,i){
   return{id:'catalog-game:'+i,title:e.title,type:'game-catalog',status:'Game record · '+String(e.stage||'unreviewed'),href:localPublicHref(e),summary:String(e.category||'Original game family')+' · Exact public source stage preserved'};
  });
  button.textContent=gameRecords.length+' game records loaded';
  render();
 }).catch(function(){button.disabled=false;button.textContent='Retry game title catalog';summary.textContent='Could not read the public games catalog. Existing modules are still available.';});
});

document.addEventListener('keydown',function(event){if(event.defaultPrevented||event.ctrlKey||event.metaKey||event.altKey||event.key!=='/')return;var t=event.target;if(t&&(t.isContentEditable||/^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName)))return;event.preventDefault();search.focus();});
render();
})();
