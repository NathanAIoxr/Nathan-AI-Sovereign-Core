import {CHASSIS,arcadeGrade} from './arcade.mjs';
import {ATLAS,CLASSES,TYPES,atlasSearch,atlasEntry} from './atlas.mjs';

const at=id=>document.getElementById(id);
let selected=ATLAS[0], medals={};
const query=at('atlas-query'), lcc=at('atlas-lcc'), kind=at('atlas-kind'), engine=at('atlas-engine');
const index=at('atlas-index');
for(const [id,label] of Object.entries(CLASSES))lcc.add(new Option(id+' · '+label,id));
for(const [id,label] of Object.entries(TYPES))kind.add(new Option(label,id));
for(const [id,rule] of Object.entries(CHASSIS))engine.add(new Option(rule.name,id));

function inspect(item){
 selected=item;
 at('atlas-name').textContent=item.id+' · '+item.title;
 at('atlas-location').textContent=item.lcc+' · '+CLASSES[item.lcc]+' / '+TYPES[item.kind];
 at('atlas-attributes').textContent=item.attributes;
 at('atlas-characteristics').textContent=item.characteristics;
 at('atlas-mechanic').textContent=CHASSIS[item.chassis].name;
 at('atlas-traits').textContent=item.traits;
 at('atlas-application').textContent=item.application+'.';
 at('atlas-target').textContent=item.target;
 at('atlas-best').textContent=medals[item.id]?arcadeGrade(medals[item.id])+' · '+medals[item.id]+' points':'Three attempts ・ 150 points for Bronze';
 at('atlas-launch').href='#atlas/'+item.id;
 for(const button of index.children)button.setAttribute('aria-pressed',String(button.dataset.entry===item.id));
}
function render(){
 const matches=atlasSearch({query:query.value,lcc:lcc.value,kind:kind.value,chassis:engine.value});
 at('atlas-count').textContent=matches.length+' of '+ATLAS.length+' entries · '+Object.keys(medals).length+' medaled';
 at('atlas-detail').hidden=!matches.length;
 at('atlas-empty').hidden=Boolean(matches.length);
 index.replaceChildren(...matches.map(item=>{
  const button=document.createElement('button');
  button.type='button';button.dataset.entry=item.id;
  button.textContent=item.id+'  '+item.title+(medals[item.id]?'  ✓':'');
  button.onclick=()=>inspect(item);
  return button;
 }));
 if(matches.length)inspect(matches.find(item=>item.id===selected.id)??matches[0]);
}
query.oninput=render;lcc.onchange=render;kind.onchange=render;engine.onchange=render;
at('atlas-clear').onclick=()=>{query.value=lcc.value=kind.value=engine.value='';render();query.focus();};
at('atlas-launch').onclick=event=>{
 if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
 event.preventDefault();
 window.dispatchEvent(new CustomEvent('grapple-atlas-launch',{detail:selected.id}));
};
window.addEventListener('grapple-atlas-medals',event=>{medals=event.detail;render();});
window.addEventListener('grapple-atlas-browse',event=>{
 const entry=atlasEntry(event.detail);
 if(entry){
  const fits=atlasSearch({query:query.value,lcc:lcc.value,kind:kind.value,chassis:engine.value}).includes(entry);
  if(!fits){query.value=lcc.value=kind.value=engine.value='';selected=entry;render();}
  else inspect(entry);
  index.querySelector('[aria-pressed="true"]')?.focus();
 }
});
render();
