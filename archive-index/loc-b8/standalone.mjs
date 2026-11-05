export const APP_VIEWS={catalog:{name:'Library Catalog',hide:['completion-panel']},completion:{name:'Project Completion',hide:['shelf-panel','finding']},backup:{name:'Backup & Restore',hide:['shelf-panel','finding','completion-panel']}};
if(typeof document!=='undefined'){
 const app=APP_VIEWS[document.documentElement.dataset.app];
 try{
  if(!app)throw new Error('Unknown standalone app.');
  const response=await fetch(new URL('./index.html',import.meta.url),{cache:'no-store'});if(!response.ok)throw new Error('Shared workspace could not be loaded.');
  const source=new DOMParser().parseFromString(await response.text(),'text/html');
  for(const node of source.querySelectorAll('script'))node.remove();
  for(const node of source.querySelectorAll('a[href]'))node.href=new URL(node.getAttribute('href'),new URL('./index.html',import.meta.url)).href;
  document.body.replaceChildren(...Array.from(source.body.childNodes).map(n=>document.importNode(n,true)));
  document.title='Nathan AI · '+app.name;document.querySelector('h1').textContent=app.name;
  const back=document.createElement('a');back.href=new URL('../../app-factory/nathan-ai/universal-workspace/index.html',import.meta.url).href;back.textContent='← Universal Workspace';document.querySelector('header').prepend(back);
  document.querySelector('#backup-toolbar').append(document.getElementById('export'));
  for(const id of app.hide){const node=document.getElementById(id);if(node)(id==='finding'?node.closest('section'):node).hidden=true;}
  const runtime=new URL('./catalog.mjs',import.meta.url);runtime.search=new URL(import.meta.url).search;await import(runtime.href);
 }catch(e){document.body.textContent=e.message;}
}
