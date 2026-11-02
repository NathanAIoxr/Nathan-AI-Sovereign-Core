/* NATHAN AI 53-year source-first navigator: all DOM text uses textContent. */
(()=>{'use strict';
const source=window.Nathan53;
if(!source)return;
const $=id=>document.getElementById(id);
const make=(tag,value,className)=>{const n=document.createElement(tag);if(value!==undefined)n.textContent=String(value);if(className)n.className=className;return n;};
const detail=(entry,label,desc)=>{
 const card=make('article',undefined,'card');
 card.append(make('small',label),make('h3',entry.name||entry.title),make('p',desc||entry.function||entry.text||entry.detail));
 return card;
};
const download=(value,name)=>{
 const uri=URL.createObjectURL(new Blob([value],{type:'application/json;charset=utf-8'}));
 const a=document.createElement('a');a.href=uri;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(uri),2300);
};
function renderTimeline(){
 $('timeline-rail').replaceChildren(...source.timeline.map(m=>{
 const card=make('article');
 card.append(make('strong',m.period),make('h3',m.title),make('p',m.text),make('small',m.kind));
 return card;
 }));
}
function renderCouncilZoom(){
 const view=source.viewAt($('zoom').value);
 $('level').textContent=view.level;
 $('zoom-title').textContent=view.label;
 $('focus-title').textContent='In focus · '+view.focus.length+' elements';
 $('council-focus').replaceChildren(...view.focus.map(m=>detail(m,m.phase+' / '+m.scope,m.function)));
 $('council-near').replaceChildren(...view.context.map(m=>detail(m,m.phase+' / '+m.scope,m.function)));
}
function renderCouncilList(){
 const result=source.filterItems(source.council,$('council-search').value,['id','name','function','scope','phase']);
 $('council-grid').replaceChildren(...result.map(m=>detail(m,m.phase+' / '+m.scope,m.function)));
 $('council-count').textContent=result.length+' of '+source.council.length+' source-led book elements';
}
function renderProducts(){
 const q=$('product-search').value,f=$('product-family').value;
 const rows=source.filterItems(source.products,q,['id','family','name','stage','source','detail']).filter(x=>!f||x.family===f);
 $('products').replaceChildren(...rows.map(x=>{
  const c=detail(x,x.family+' · '+x.stage,x.detail);
  c.append(make('p','Original source: '+x.source),make('small','Next validation: '+x.priority));
  return c;
 }));
 $('product-count').textContent=rows.length+' of '+source.products.length+' owner/source-linked design references';
}
function init(){
 renderTimeline();
 for(const cat of [...new Set(source.products.map(x=>x.family))].sort()){
 const o=make('option',cat);o.value=cat;$('product-family').append(o);
 }
 $('zoom').addEventListener('input',renderCouncilZoom);
 $('council-search').addEventListener('input',renderCouncilList);
 $('product-search').addEventListener('input',renderProducts);
 $('product-family').addEventListener('change',renderProducts);
 $('export').addEventListener('click',()=>download(source.getReport(),'nathan-ai-53-year-council-toy-public-index.json'));
 renderCouncilZoom();renderCouncilList();renderProducts();
}
init();
})();