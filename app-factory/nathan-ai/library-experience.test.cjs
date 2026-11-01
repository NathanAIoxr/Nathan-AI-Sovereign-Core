'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const base=__dirname;
const html=fs.readFileSync(path.join(base,'index.html'),'utf8');
const script=fs.readFileSync(path.join(base,'library-experience.js'),'utf8');
const styles=fs.readFileSync(path.join(base,'library-experience.css'),'utf8');
test('new reader is additive to the original Nathan AI hub',()=>{
  for(const id of ['library','apps','main-database','books','book-apps'])assert.match(html,new RegExp('id="'+id+'"'));
  assert.match(html,/href="#main-database"/);
  assert.match(html,/href="#books"/);
  assert.match(html,/href="#book-apps"/);
  assert.match(html,/library-experience\.css/);
  assert.match(html,/library-experience\.js/);
  assert.match(html,/hub\.js/);
  assert.match(styles,/#00d8ff/i);
});
test('all linked published book app targets remain distinct',()=>{
  for(const app of ['library-mind','library','tabor-trinity','assocchio','mother-earth','rcc-time'])
    assert.match(html,new RegExp('\.\./one/'+app+'/index\\.html'));
  assert.match(html,/\.\.\/dummie-publisher\/index\.html/);
  assert.match(html,/owner-only Main Database is not silently copied/i);
});
test('client reader parses safely and only fetches public catalogs',async()=>{
  assert.doesNotThrow(()=>new vm.Script(script,{filename:'library-experience.js'}));
  assert.doesNotMatch(script,/innerHTML\s*=/);
  const elements=new Map(),requests=[];
  class El{
    constructor(name){this.name=name;this.textContent='';this.children=[];this.handlers={};this.hidden=false;this.attributes={};this.className='';this.dataset={};}
    append(...items){this.children.push(...items)}
    replaceChildren(...items){this.children=[...items]}
    addEventListener(name,handler){this.handlers[name]=handler}
    setAttribute(name,value){this.attributes[name]=value}
    focus(){}
  }
  const el=id=>{if(!elements.has(id))elements.set(id,new El(id));return elements.get(id)};
  const controls=['all','reading','plan'].map(scope=>{const b=new El('button');b.dataset.bookScope=scope;return b});
  const docs=[{id:'reading-one',title:'ORIGINAL BOOK',stage:'Draft',language:'English',content:'Exact original text <do not execute>'}];
  const plan=[{id:'plan-one',title:'BOOK ONE',stage:'Saved treatment',content:'Plan words'}];
  const document={
    getElementById:el,
    createElement:tag=>new El(tag),
    querySelectorAll:selector=>selector==='[data-book-scope]'?controls:[]
  };
  const fetch=async url=>{
    requests.push(url);
    return {ok:true,json:async()=>url.endsWith('documents.json')?docs:plan};
  };
  vm.runInNewContext(script,{document,fetch,console});
  await new Promise(resolve=>setTimeout(resolve,0));
  assert.equal(el('books-grid').children.length,2);
  assert.match(el('books-status').textContent,/2 matching public records/);
  const card=el('books-grid').children[0];
  card.children[4].handlers.click();
  assert.equal(el('books-reader-body').textContent,docs[0].content);
  controls[2].handlers.click();
  assert.equal(el('books-grid').children.length,1);
  assert.match(el('books-grid').children[0].children[1].textContent,/BOOK ONE/);
  assert.deepEqual(requests,['../one/library-mind/documents.json','../one/library-mind/plan.json']);
});
