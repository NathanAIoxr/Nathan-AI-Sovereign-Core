'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const C=require('./catalog.js'),E=require('./engine.js');
class FakeElement {
 constructor(tag='div'){this.tagName=tag.toUpperCase();this.value='';this.textContent='';
   this.files=[];this.children=[];this.listeners={};this.style={};this.dataset={};
   this.options=[];this.attributes={};this.className='';}
 addEventListener(type,handler){(this.listeners[type]??=[]).push(handler);}
 append(...children){this.children.push(...children);}
 replaceChildren(){this.children=[];this.options=[];}
 add(option){this.options.push(option);if(this.options.length===1)this.value=option.value;}
 setAttribute(key,value){this.attributes[key]=String(value);}
 querySelectorAll(){return [];}
 async fire(type){for(const callback of (this.listeners[type]||[]))await callback({type,currentTarget:this,target:this});}
}
function bootFake(){
 const root=new Map(),listeners={};
 const document={
  createElement(tag){return new FakeElement(tag);},
  getElementById(id){if(!root.has(id))root.set(id,new FakeElement());return root.get(id);},
  addEventListener(type,fn){(listeners[type]??=[]).push(fn);}
 };
 const context={window:{TTFESCatalog:C,TTFESCore:E},document,
   navigator:{},location:{protocol:'http:'},Option:function(label,value){return {label,value};},
   TextEncoder,TextDecoder,Uint8Array,console,setTimeout,Blob,URL};
 const code=fs.readFileSync(path.join(__dirname,'app.js'),'utf8');
 vm.runInNewContext(code,context,{filename:'app.js'});
 (listeners.DOMContentLoaded||[]).forEach(fn=>fn());
 return {el:id=>document.getElementById(id),root};
}
test('real source-file input handler recognizes owner-selected raw bytes and updates UI',async()=>{
 const fake=bootFake();
 const orig='HELLO\r\nOriginal UTF-8 — 🌞';
 const raw=new TextEncoder().encode(orig);
 const input=fake.el('source-file');
 input.files=[{name:'Original.md',size:raw.length,arrayBuffer:async()=>raw.buffer}];
 await input.fire('change');
 assert.ok(fake.el('source-status').textContent.includes('imported locally'),fake.el('source-status').textContent);
 assert.ok(fake.el('original-source').value.includes('HELLO'));
 assert.equal(fake.el('source-reference').value,'Original.md');
 assert.equal(input.value,'');
});
test('asset import event appends new owner-supplied media list without a network request',async()=>{
 const fake=bootFake();
 const raw=new TextEncoder().encode('my local asset');
 const input=fake.el('asset-files');
 input.files=[{name:'illustration.txt',size:raw.length,arrayBuffer:async()=>raw.buffer}];
 await input.fire('change');
 assert.equal(fake.el('asset-list').children.length,1);
 assert.ok(fake.el('asset-list').children[0].textContent.includes('illustration.txt'));
});
test('workspace file change loads independent mappings and source text',async()=>{
 const fake=bootFake();
 const workspace={schema:E.VERSION,source:'ROOT ORIGINAL',projectTitle:'Source Library',
   creator:'Nathan Tabor',reference:'Main Original',
   targets:[{id:'grants-gov',fields:{proposal:'Proposed local narrative'}},
            {id:'shopify',fields:{title:'Draft product'}}]};
 const file={name:'saved.json',size:230,text:async()=>JSON.stringify(workspace)};
 const input=fake.el('import-project');input.files=[file];
 await input.fire('change');
 assert.equal(fake.el('original-source').value,'ROOT ORIGINAL');
 assert.equal(fake.el('project-title').value,'Source Library');
 assert.equal(fake.el('active-target').options.length,2);
 assert.ok(fake.el('batch-status').textContent.includes('Workspace restored'));
});
