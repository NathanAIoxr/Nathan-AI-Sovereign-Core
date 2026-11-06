/* TTFES&BTP creator-defined 4-plane matrix studio; source remains untouched. */
(function(){
 'use strict';
 const byId=x=>document.getElementById(x);
 let packet=null;
 function status(msg){byId('matrix-status').textContent=msg;}
 function download(contents,name){
   const url=URL.createObjectURL(new Blob([contents],{type:'application/json'}));
   const link=document.createElement('a');link.href=url;link.download=name;
   document.body.append(link);link.click();link.remove();
   setTimeout(()=>URL.revokeObjectURL(url),15000);
 }
 function boot(){
   const M=window.TTFESMatrix;
   if(!M)return;
   const verify=M.audit();
   byId('matrix-coordinates').textContent=verify.planes+' planes · '+verify.axes+' axes · '+
     verify.stacks+' learning stacks · '+verify.modes+' creator-defined modes · '+verify.lenses+' user-defined reading lens slots.';
   for(const stack of M.STACKS)byId('matrix-stack').add(new Option(stack,stack));
   function fillModes(){
     const active=byId('matrix-plane').value,select=byId('matrix-mode');
     select.replaceChildren();
     for(const mode of M.MODES.filter(m=>m.plane===active))
       select.add(new Option(mode.name,mode.id));
   }
   byId('matrix-plane').addEventListener('change',fillModes);
   fillModes();
   const lenses=M.createLenses(),region=byId('lens-list');
   for(const lens of lenses){
     const label=document.createElement('label');
     label.textContent='Lens '+String(lens.index).padStart(2,'0');
     const input=document.createElement('input');
     input.type='text';input.maxLength=120;input.placeholder='Author-defined label';
     input.dataset.lensIndex=String(lens.index);
     label.appendChild(input);region.appendChild(label);
   }
   byId('matrix-derive').addEventListener('click',()=>{
     try{
       const source=byId('original-source').value;
       packet=M.derive(source,byId('matrix-mode').value,
         'Stack: '+byId('matrix-stack').value);
       byId('matrix-output').value=packet.derived.text;
       status(packet.plane+' · '+packet.mode+' · original and derivative independently held.\n'+
         'Derived view is creator-defined; not a verified historical, linguistic, scientific or clinical conclusion.');
     }catch(e){status('NOT GENERATED: '+e.message);}
   });
   byId('matrix-export').addEventListener('click',()=>{
     try{
       if(!packet)throw Error('Build a derived view first.');
       download(JSON.stringify(packet,null,2)+'\n','ttfes-btp-original-and-derived.json');
       status('Separate original/derived JSON prepared for download. Source textarea unchanged.');
     }catch(e){status('NOT EXPORTED: '+e.message);}
   });
   byId('matrix-copy').addEventListener('click',async()=>{
     try{
       if(!packet)throw Error('Build a derived view first.');
       if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable. Use the exported JSON instead.');
       await navigator.clipboard.writeText(packet.derived.text);
       status('Only the derived layer copied. Original source not modified.');
     }catch(e){status('NOT COPIED: '+e.message);}
   });
   byId('save-lenses').addEventListener('click',()=>{
     try{
       const labels=Array.from(region.querySelectorAll('[data-lens-index]'),el=>el.value);
       const list=M.createLenses(labels);
       download(JSON.stringify({schema:'ttfes-btp.user-lenses.v1',creator:'Nathan Tabor',
         labels:list,custom:true,clinicalStandard:false},null,2)+'\n',
         'ttfes-btp-38-user-lenses.json');
       status('38 user-defined lens slots prepared for local download, separately from original text.');
     }catch(e){status('NOT SAVED: '+e.message);}
   });
 }
 document.addEventListener('DOMContentLoaded',boot);
})();