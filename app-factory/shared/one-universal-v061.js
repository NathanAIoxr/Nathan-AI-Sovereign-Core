/* ONE UNIVERSAL FABRIC v061 — Nathan Tabor.
 * Additive, local-first, opt-in. Never reads app/private content or silently connects services.
 * No analytics, camera, microphone, GPS, account access, or automatic publication.
 */
(function(){
'use strict';
if(window.TaborOneUniversalV061)return;
var script=document.currentScript;
var base=script&&script.src?new URL('../',script.src):new URL('./',location.href);
var ERAS=[
 ['BCE','Before Component Engines','Legacy code: preserve, inventory, refactor'],
 ['BC','Before Code','Intent, research, consent, storyboarding, wireframes'],
 ['AC','Atomic & Cosmic','Tokens, atoms, components, pages, platforms, universe'],
 ['CE','Component Era','Build, run, route, render, test, hydrate'],
 ['AD','After Deployment','Opt-in diagnostics, support, repair and revision']
];
var SCALE=['Sub-pixel','Design tokens','Atoms','Molecules','Organisms','Templates','Pages','App modules','Operating systems','App galaxy','ONE universe'];
var defaultState={skin:'original',reader:'original',rtl:false,reduceMotion:false};
var state=Object.assign({},defaultState),saved=false,priorDirection=null;
var api=Object.freeze({
 version:'v061',
 eras:ERAS.map(function(x){return {id:x[0],label:x[1],purpose:x[2]};}),
 scale:SCALE.slice(),
 getState:function(){return Object.assign({},state);},
 setState:function(p){change(p||{});},
 getFactoryURL:function(p){return new URL(p||'',base).href;}
});
window.TaborOneUniversalV061=api;
function link(p){return new URL(p,base).href;}
function apply(){
 var root=document.getElementById('one-v061-root');if(!root)return;
 root.dataset.skin=state.skin;root.dataset.reader=state.reader;
 root.style.setProperty('--one-scale',state.reader==='simple'?'1.07':state.reader==='deep'?'.97':'1');
 document.documentElement.classList.toggle('one-v061-reduced-motion',state.reduceMotion);
 if(state.rtl){if(priorDirection===null)priorDirection=document.documentElement.getAttribute('dir');document.documentElement.setAttribute('dir','rtl');}
 else if(priorDirection!==null){if(priorDirection)document.documentElement.setAttribute('dir',priorDirection);else document.documentElement.removeAttribute('dir');priorDirection=null;}
 root.querySelectorAll('[data-one-input]').forEach(function(el){var k=el.dataset.oneInput;if(el.type==='checkbox')el.checked=!!state[k];else el.value=state[k];});
 var s=root.querySelector('[data-one-status]');if(s)s.textContent=(saved?'Settings saved locally. ':'Settings active for this view; Save to retain them. ')+'Your original app content is untouched.';
 try{window.dispatchEvent(new CustomEvent('one:settingschange',{detail:api.getState()}));}catch(e){}
}
function change(p){Object.keys(p).forEach(function(k){if(Object.prototype.hasOwnProperty.call(state,k)&&typeof p[k]===typeof state[k])state[k]=p[k];});saved=false;apply();}
function save(){try{localStorage.setItem('one.v061.shell.preferences',JSON.stringify(state));saved=true;apply();}catch(e){var s=document.querySelector('#one-v061-root [data-one-status]');if(s)s.textContent='Local browser storage is unavailable; changes remain active in this tab.';}}
function restore(){try{var raw=localStorage.getItem('one.v061.shell.preferences');if(raw){var p=JSON.parse(raw);Object.keys(defaultState).forEach(function(k){if(typeof p[k]===typeof defaultState[k])state[k]=p[k];});saved=true;}}catch(e){}}
function exportFile(){var data={schema:'one.shell.preferences.v061',settings:api.getState(),note:'No manuscript, private account data, device telemetry or app content is included.'};var url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));var a=document.createElement('a');a.href=url;a.download='ONE_v061_shell_settings.json';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},1000);}
function start(){
 if(document.getElementById('one-v061-root'))return;
 restore();
 if(script&&script.src){var css=document.createElement('link');css.rel='stylesheet';css.href=new URL('one-universal-v061.css',script.src).href;document.head.appendChild(css);}
 var root=document.createElement('div');root.id='one-v061-root';
 root.innerHTML='<button type="button" class="one-v061-open" aria-controls="one-v061-panel" aria-expanded="false">✦ ONE · SYSTEM</button>'+
 '<section id="one-v061-panel" role="dialog" aria-modal="false" aria-label="ONE universal system controls" hidden>'+
 '<div class="one-v061-heading"><div><strong>ONE — THE LAST APP</strong><small>Universal system · v061 · by Nathan Tabor</small></div><button type="button" data-one-close aria-label="Close ONE system">×</button></div>'+
 '<p>Meet people where they are. Your original app keeps its own content, functions, and identity.</p>'+
 '<nav class="one-v061-links" aria-label="Connected public apps"><a data-one-href="one/">ONE</a><a data-one-href="./">Factory</a><a data-one-href="system/">System Atlas</a><a data-one-href="one/library/">Library</a><a data-one-href="one/meet/">Meet</a></nav>'+
 '<details open><summary>Five eras · technical lifecycle</summary><ol class="one-v061-eras"></ol></details>'+
 '<details><summary>Sub-atomic to cosmic</summary><p class="one-v061-scale"></p></details>'+
 '<fieldset><legend>Reader and appearance — your choice</legend>'+
 '<label>Shell skin<select data-one-input="skin"><option value="original">Original app</option><option value="night">Night shell</option><option value="warm">Warm shell</option><option value="contrast">High-contrast shell</option></select></label>'+
 '<label>Reader pathway<select data-one-input="reader"><option value="original">Original words</option><option value="simple">Simple</option><option value="deep">Deep</option><option value="create">Create</option></select></label>'+
 '<label class="one-v061-check"><input type="checkbox" data-one-input="rtl"> Right-to-left view</label>'+
 '<label class="one-v061-check"><input type="checkbox" data-one-input="reduceMotion"> Reduce motion</label>'+
 '</fieldset><div class="one-v061-actions"><button type="button" data-one-save>Save locally</button><button type="button" data-one-export>Export settings</button><button type="button" data-one-reset>Reset</button></div>'+
 '<p role="status" aria-live="polite" data-one-status></p>'+
 '<small class="one-v061-boundary">No monitoring, account access, cloud synchronization, camera, GPS, microphone, or guaranteed native installation. Preferences and links only; original app operation remains independent.</small></section>';
 document.body.appendChild(root);
 root.querySelectorAll('[data-one-href]').forEach(function(a){a.href=link(a.dataset.oneHref);});
 var list=root.querySelector('.one-v061-eras');ERAS.forEach(function(e){var li=document.createElement('li'),name=document.createElement('b'),description=document.createElement('span');name.textContent=e[0]+' — '+e[1];description.textContent=e[2];li.appendChild(name);li.appendChild(description);list.appendChild(li);});
 root.querySelector('.one-v061-scale').textContent=SCALE.join(' → ');
 var trigger=root.querySelector('.one-v061-open'),panel=root.querySelector('#one-v061-panel');
 function toggle(on){panel.hidden=!on;trigger.setAttribute('aria-expanded',String(on));(on?root.querySelector('[data-one-close]'):trigger).focus();}
 trigger.addEventListener('click',function(){toggle(panel.hidden);});root.querySelector('[data-one-close]').addEventListener('click',function(){toggle(false);});
 document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!panel.hidden)toggle(false);});
 root.querySelectorAll('[data-one-input]').forEach(function(el){el.addEventListener('change',function(){var p={};p[el.dataset.oneInput]=el.type==='checkbox'?el.checked:el.value;change(p);});});
 root.querySelector('[data-one-save]').addEventListener('click',save);
 root.querySelector('[data-one-export]').addEventListener('click',exportFile);
 root.querySelector('[data-one-reset]').addEventListener('click',function(){state=Object.assign({},defaultState);saved=false;try{localStorage.removeItem('one.v061.shell.preferences');}catch(e){}apply();});
 apply();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();