/* Browser-only controls for NATHAN AI Flyer Studio; nothing is uploaded */
(function(){
'use strict';
const engine=window.NathanFlyer;
if(!engine){return;}
const $=id=>document.getElementById(id);
const STORE='nathan-ai.flyer-studio.draft.v1';
const FIELDS=['eyebrow','headline','body','cta','url'];
let state=engine.getPreset('nathan'),lastObjectURL=null;
function status(message){$('status').textContent=message}
function selectFill(el,entries,value){el.replaceChildren(...entries.map(([id,name])=>{const o=document.createElement('option');o.value=id;o.textContent=name;return o}));el.value=value}
function hydrate(){
 $('preset').value=state.preset;
 $('palette').value=state.palette;
 $('format').value=state.format;
 $('style').value=state.style;
 for(const k of FIELDS)$(k).value=state[k];
 $('footerline').value=state.footer;
 render();
}
function render(){
 state=engine.normalize(state);
 const format=engine.FORMATS[state.format];
 const svg=engine.buildSVG(state);
 const blob=new Blob([svg],{type:'image/svg+xml;charset=utf-8'});
 const next=URL.createObjectURL(blob),img=$('preview'),previous=lastObjectURL;
 img.addEventListener('load',()=>{if(previous)URL.revokeObjectURL(previous)},{once:true});
 img.addEventListener('error',()=>{if(previous)URL.revokeObjectURL(previous);status('Unable to preview SVG on this browser. Use the SVG download.')},{once:true});
 img.src=next;lastObjectURL=next;img.width=format.w;img.height=format.h;
 $('resolution').textContent=format.w.toLocaleString()+' × '+format.h.toLocaleString()+' px';
}
function download(blob,name){
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=name;document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),2500);
}
function filename(ext){return engine.slug(state.headline||'nathan-ai-flyer')+'.'+ext}
function svgBlob(){return new Blob([engine.buildSVG(state)],{type:'image/svg+xml;charset=utf-8'})}
function pngExport(){
 const btn=$('png');btn.disabled=true;status('Rendering PNG on this device…');
 const format=engine.FORMATS[state.format],url=URL.createObjectURL(svgBlob()),img=new Image();
 let settled=false;
 function cleanup(){if(!settled){settled=true;URL.revokeObjectURL(url);btn.disabled=false;}}
 img.onload=()=>{
   try{
     const canvas=document.createElement('canvas');canvas.width=format.w;canvas.height=format.h;
     const context=canvas.getContext('2d');if(!context)throw new Error('Canvas is not available');
     context.drawImage(img,0,0,format.w,format.h);
     canvas.toBlob(blob=>{
       if(blob){download(blob,filename('png'));status('PNG exported at '+format.w+' × '+format.h+' pixels.');}
       else status('PNG export is unavailable here. Use Download SVG.');
       cleanup();
     },'image/png');
   }catch(e){cleanup();status('PNG export unavailable: '+e.message+'. SVG download remains available.');}
 };
 img.onerror=()=>{cleanup();status('PNG rendering failed in this browser. Download SVG instead.')};
 img.src=url;
}
function init(){
 selectFill($('preset'),engine.PRESETS.map(p=>[p.id,p.name]),'nathan');
 selectFill($('format'),Object.entries(engine.FORMATS).map(([id,f])=>[id,f.name]),'portrait');
 selectFill($('palette'),Object.entries(engine.PALETTES).map(([id,p])=>[id,p.name]),'sovereign');
 try{
   const saved=localStorage.getItem(STORE);
   if(saved){state=engine.importJSON(saved);status('Last saved local design loaded.');}
 }catch(e){status('Local storage unavailable; designing and downloading still work.');}
 hydrate();
 $('preset').addEventListener('change',()=>{
   const format=state.format;
   state={...engine.getPreset($('preset').value),format};
   hydrate();status('Template selected. Your prior design remains in this session until you save.');
 });
 for(const id of ['format','palette','style']){
   $(id).addEventListener('change',()=>{state[id]=$(id).value;render()});
 }
 for(const k of FIELDS){
   $(k).addEventListener('input',()=>{state[k]=$(k).value;render()});
 }
 $('footerline').addEventListener('input',()=>{state.footer=$('footerline').value;render()});
 $('reset').addEventListener('click',()=>{const fmt=state.format;state={...engine.getPreset(state.preset),format:fmt};hydrate();status('Template wording restored. Saved file and original sources are unchanged.')});
 $('save').addEventListener('click',()=>{
   try{localStorage.setItem(STORE,engine.exportJSON(state));status('Saved this design in this browser. Export JSON for a separate backup.');}
   catch(e){status('This browser blocked local storage. Export a JSON design file instead.');}
 });
 $('svg').addEventListener('click',()=>{download(svgBlob(),filename('svg'));status('SVG vector flyer downloaded.');});
 $('png').addEventListener('click',pngExport);
 $('json').addEventListener('click',()=>{download(new Blob([engine.exportJSON(state)],{type:'application/json'}),filename('json'));status('Editable design JSON downloaded.');});
 $('print').addEventListener('click',()=>{status('Use your browser’s print dialog; choose Save as PDF for PDF.');window.print()});
 $('import').addEventListener('change',async()=>{
   const file=$('import').files&&$('import').files[0];if(!file)return;
   try{if(file.size>30000)throw new Error('File exceeds 30 KB limit.');
     const candidate=engine.importJSON(await file.text());state=candidate;hydrate();status('Design imported locally; original JSON was not changed.');}
   catch(e){status('Import rejected: '+e.message)}
   finally{$('import').value=''}
 });
 window.addEventListener('beforeunload',()=>{if(lastObjectURL)URL.revokeObjectURL(lastObjectURL)});
}
init();
})();