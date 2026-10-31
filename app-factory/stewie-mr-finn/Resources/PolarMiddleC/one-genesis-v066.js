/* ONE GENESIS v066 — applies the reversible 4-state registry engine to the current public app.
 * This is an opt-in local model; it NEVER modifies app content, credentials, original books,
 * remote records, payments, files, or other programs. Seven commands are represented as
 * operations in order; exact author manuscript remains in the private ONE book archive.
 */
(function(){
'use strict';
if(window.TaborOneGenesisV066)return;
var TYPES=['Book','App','Image','Language','Research','Character','Game','Library'];
var Q=['nothing','something','anything','everything'];
var originals=[];var visible=[];var archive=[];var events=[];var undoStack=[];
var moduleKey=location.pathname.replace(/[^a-z0-9/._-]/gi,'').slice(0,190)||'/';
function clone(v){return JSON.parse(JSON.stringify(v));}
function catalog(){return TYPES.map(function(n,i){return {id:'one-'+String(i+1).padStart(2,'0'),name:n,kind:n.toLowerCase(),app:moduleKey,origin:'declared design template, not existing media'};});}
originals=catalog();
function selected(q,seed){
 if(q==='nothing')return [];
 if(q==='everything')return clone(originals);
 if(q==='anything'){var found=originals.find(function(x){return x.kind===seed.toLowerCase()});return [clone(found||originals[0])];}
 return [{id:'one-created-'+String(events.length+1),name:seed,kind:'created',app:moduleKey,origin:'user-input session record'}];
}
function checkpoint(){undoStack.push({visible:clone(visible),archive:clone(archive),events:clone(events)});if(undoStack.length>100)undoStack.shift();}
function validate(q,seed){return Q.includes(q)&&typeof seed==='string'&&seed.trim().length>0&&seed.length<=128;}
function run(source,target,seed){
 if(!validate(source,seed)||!Q.includes(target))throw Error('Invalid scope or seed (1–128 characters)');
 seed=seed.trim();checkpoint();var input=selected(source,seed);
 if(target==='nothing'){
  var existing=new Map(archive.map(function(x){return [x.id,x];}));
  visible.forEach(function(x){existing.set(x.id,x);});archive=Array.from(existing.values());visible=[];
 }else visible=selected(target,seed);
 var e={step:events.length+1,source:source,target:target,seed:seed,sourceCardinality:input.length,visible:visible.length,archive:archive.length,app:moduleKey};events.push(e);render();return clone(e);
}
function dual(seed){if(!validate('anything',seed))throw Error('Invalid seed');checkpoint();visible=clone(originals);var e={step:events.length+1,source:'anything + something',target:'everything + nothing',seed:seed.trim(),branches:{everything:visible.length,nothing:0},app:moduleKey};events.push(e);render();return clone(e);}
function sequence(seed){if(!validate('something',seed))throw Error('Invalid seed');var steps=[['nothing','everything'],['nothing','anything'],['something','nothing'],['nothing','everything'],['nothing','anything'],['nothing','something']];dual(seed);steps.forEach(function(a){run(a[0],a[1],seed);});render();return events.slice(-7).map(clone);}
function undo(){if(!undoStack.length)return false;var p=undoStack.pop();visible=p.visible;archive=p.archive;events=p.events;render();return true;}
function reset(){visible=[];archive=[];events=[];undoStack=[];render();}
function exportData(){return {schema:'one.genesis.v066',app:moduleKey,templateCatalog:clone(originals),visible:clone(visible),preservedArchive:clone(archive),events:clone(events),notice:'User-operated symbolic data views. Source app data was not modified.'};}
var api=Object.freeze({version:'v066',quantities:Q.slice(),getCurrentApp:function(){return moduleKey},run:run,dual:dual,runSeven:sequence,undo:undo,reset:reset,export:exportData});window.TaborOneGenesisV066=api;
var root,wrap,from,to,seed,status,output;
function render(){
 if(!wrap)return;
 var snap=exportData();
 output.replaceChildren();
 if(!visible.length){var empty=document.createElement('span');empty.textContent='∅ Empty view. Original records untouched.';output.appendChild(empty);}
 else visible.forEach(function(rec){var span=document.createElement('span');span.className='one-genesis-tile';span.textContent=rec.name;output.appendChild(span);});
 status.textContent=snap.visible.length+' visible · '+snap.preservedArchive.length+' archived · '+snap.events.length+' recorded actions · Original app unchanged';
}
function make(){
 if(document.getElementById('one-v066-genesis'))return true;
 root=document.getElementById('one-v061-root');if(!root)return false;
 var panel=root.querySelector('#one-v061-panel');if(!panel)return false;
 var css=document.createElement('style');css.id='one-v066-style';css.textContent='#one-v061-root #one-v066-genesis{border-top:1px solid var(--one-line);margin:10px 0;padding:10px 0;color:var(--one-ink)}#one-v066-genesis summary{font-weight:800;color:var(--one-accent)}#one-v066-genesis .one-genesis-field{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:9px 0}#one-v066-genesis .one-genesis-field label{display:block}#one-v066-genesis input,#one-v066-genesis select{font:inherit;border:1px solid var(--one-line);color:var(--one-ink);background:var(--one-bg);padding:8px;border-radius:7px;width:100%}#one-v066-genesis .one-genesis-actions{display:flex;flex-wrap:wrap;gap:6px;margin:9px 0}#one-v066-genesis .one-genesis-actions button{font-size:.86em}#one-v066-genesis .one-genesis-result{display:flex;gap:4px;flex-wrap:wrap;padding:8px;border-radius:8px;border:1px dashed var(--one-line);min-height:45px}#one-v066-genesis .one-genesis-tile{border-radius:7px;background:var(--one-accent);color:#161c25;padding:5px 7px;font-size:.83em}#one-v066-genesis p{margin:6px 0}';document.head.appendChild(css);
 wrap=document.createElement('details');wrap.id='one-v066-genesis';
 wrap.innerHTML='<summary>BUILD EVERYTHING / NOTHING · v066</summary><p>Apply the creation model to this app. No original app data is changed.</p><div class="one-genesis-field"><label>OUT OF<select data-v066="from"><option>nothing</option><option>something</option><option>anything</option><option>everything</option></select></label><label>BUILD<select data-v066="to"><option>everything</option><option>anything</option><option>something</option><option>nothing</option></select></label></div><label>Record seed<input data-v066="seed" value="Book" maxlength="128"></label><div class="one-genesis-actions"><button type="button" data-v066="run">Build</button><button type="button" data-v066="dual">Everything + Nothing</button><button type="button" data-v066="sequence">Apply 7 in order</button><button type="button" data-v066="undo">Undo</button><button type="button" data-v066="reset">Reset</button><button type="button" data-v066="export">Export JSON</button></div><div class="one-genesis-result" data-v066="output" aria-live="polite"></div><p data-v066="status" role="status"></p><small>Eight template records; the app stays independent. No cloud calls, deletion or physical matter creation.</small>';
 var boundary=panel.querySelector('.one-v061-boundary');if(boundary)panel.insertBefore(wrap,boundary);else panel.appendChild(wrap);
 from=wrap.querySelector('[data-v066="from"]');to=wrap.querySelector('[data-v066="to"]');seed=wrap.querySelector('[data-v066="seed"]');status=wrap.querySelector('[data-v066="status"]');output=wrap.querySelector('[data-v066="output"]');
 function bind(n,f){wrap.querySelector('[data-v066="'+n+'"]').addEventListener('click',function(){try{f();}catch(e){status.textContent=e.message;}});}
 bind('run',function(){run(from.value,to.value,seed.value)});
 bind('dual',function(){dual(seed.value)});
 bind('sequence',function(){sequence(seed.value)});
 bind('undo',function(){if(!undo())status.textContent='Nothing to undo. Original remains unchanged.';});
 bind('reset',reset);
 bind('export',function(){var blob=new Blob([JSON.stringify(exportData(),null,2)],{type:'application/json'}),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='ONE_v066_'+moduleKey.split('/').filter(Boolean).pop()+'_SESSION.json';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u)},1500);});
 render();return true;
}
if(!make()){
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){if(!make())window.addEventListener('one:settingschange',make,{once:true});},{once:true});
 else window.addEventListener('one:settingschange',make,{once:true});
}
})();