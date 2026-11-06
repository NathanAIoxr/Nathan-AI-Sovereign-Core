/* Browser-only source index. No private uploads, telemetry, case intake or external APIs. */
(function(){
'use strict';
var data=null,collection='points',term='',category='',limit=18;
var search=document.getElementById('record-search'),categoryField=document.getElementById('record-category'),more=document.getElementById('record-more'),root=document.getElementById('record-list'),summary=document.getElementById('record-summary');
function el(tag,text,cls){var node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node;}
function records(){return data&&Array.isArray(data[collection])?data[collection]:[];}
function filtered(){return records().filter(function(r){return(!category||r.category===category)&&(!term||[r.title,r.category,r.status,r.id].join(' ').toLowerCase().includes(term));});}
function render(){if(!data)return;var found=filtered(),shown=found.slice(0,limit);root.replaceChildren();
shown.forEach(function(r){var art=el('article'),tag=el('small',r.id+' · '+r.category),h=el('h3',r.title),p=el('p',r.status);art.append(tag,h,p);root.append(art);});
if(!found.length)root.append(el('p','No matches. Clear search or change the category.'));summary.textContent=found.length+' source records match · '+shown.length+' displayed · archival metadata, not live program status.';more.hidden=shown.length>=found.length;more.textContent='Show more titles ('+Math.max(0,found.length-shown.length)+' remaining)';}
function setCollection(key){collection=key;limit=18;category='';categoryField.replaceChildren(el('option','All categories'));categoryField.firstChild.value='';
Array.from(new Set(records().map(function(r){return r.category;}))).sort().forEach(function(c){var opt=el('option',c);opt.value=c;categoryField.append(opt);});
document.querySelectorAll('button[data-collection]').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.collection===key));});render();}
document.querySelectorAll('button[data-collection]').forEach(function(b){b.addEventListener('click',function(){setCollection(b.dataset.collection);});});
search.addEventListener('input',function(){term=search.value.trim().toLowerCase();limit=18;render();});categoryField.addEventListener('change',function(){category=categoryField.value;limit=18;render();});more.addEventListener('click',function(){limit+=18;render();});
fetch('./records.json',{cache:'no-store'}).then(function(r){if(!r.ok)throw Error('HTTP '+r.status);return r.json();}).then(function(x){if(x.schema!=='nathan-tabor.innocence-source-index.v1')throw Error('Unexpected source version');data=x;document.getElementById('count-points').textContent=x.points.length;document.getElementById('count-faith').textContent=x.faithWorks.length;document.getElementById('count-families').textContent=x.recoveredFamilies.length;setCollection('points');}).catch(function(e){summary.textContent='Could not load the public metadata index: '+e.message+'. Use the direct JSON link or the independent Children & Innocence directory.';more.hidden=true;});
})();