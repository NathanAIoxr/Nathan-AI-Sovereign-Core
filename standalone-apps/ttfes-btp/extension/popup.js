/* TTFES&BTP Chrome/Chromium Manifest V3 companion — Nathan Tabor.
 * Runs only on explicit action, no background script, no host permissions.
 */
(function(){
 'use strict';
 const $=id=>document.getElementById(id);
 function status(x){$('status').textContent=x;}
 function fieldHelper(data){
   'use strict';
   // This function is injected into ONLY the owner-selected active tab.
   // No traffic, local storage, sensitive credential reads or submissions.
   const ID='ttfes-btp-active-field-panel';
   if(document.getElementById(ID)){
     document.getElementById(ID).remove();
   }
   let lastTarget=null,chosen='';
   const fields=data&&data.fields||{};
   const keys=Object.keys(fields).filter(k=>typeof fields[k]==='string' && fields[k].trim().length>0 &&
     !/^(certification|account_info|tax_info|residency)$/.test(k));
   if(!keys.length)return;
   const box=document.createElement('section');
   box.id=ID;
   Object.assign(box.style,{
     position:'fixed',zIndex:'2147483646',bottom:'14px',right:'14px',
     width:'min(395px,calc(100vw - 28px))',maxHeight:'60vh',overflowY:'auto',
     boxSizing:'border-box',border:'2px solid #ecc874',borderRadius:'14px',
     boxShadow:'0 14px 40px #000a',background:'#10283a',color:'#f6f1e6',
     font:'14px/1.5 system-ui,sans-serif',padding:'14px',textAlign:'left'
   });
   const add=(tag,txt,parent)=>{const e=document.createElement(tag);if(txt!==undefined)e.textContent=txt;(parent||box).appendChild(e);return e;};
   const h=add('h2','TTFES&BTP · Field Slide');h.style.cssText='font:800 17px system-ui;margin:0 0 9px;color:#f2d085;';
   const note=add('p','1. Select a source field below. 2. Click a writable text box on THIS website. 3. Press Alt+Shift+V or the Fill button. Review before saving.');
   const select=add('select','');
   Object.assign(select.style,{width:'100%',background:'#071a25',color:'#fff',padding:'7px',border:'1px solid #b4cbd2',borderRadius:'7px'});
   for(const k of keys){const opt=document.createElement('option');opt.value=k;opt.textContent=k+' — '+fields[k].slice(0,35);select.appendChild(opt);}
   chosen=keys[0];select.addEventListener('change',()=>{chosen=select.value;});
   const button=add('button','FILL LAST FOCUSED TEXT FIELD');
   Object.assign(button.style,{width:'100%',margin:'10px 0',border:0,borderRadius:'7px',padding:'9px',background:'#f0c978',color:'#102331',fontWeight:'900',cursor:'pointer'});
   const output=add('p','Nothing transferred. No page submitted.');
   output.setAttribute('role','status');output.style.cssText='font-size:12px;color:#c8e0e9;white-space:pre-wrap;';
   const close=add('button','Close panel');
   Object.assign(close.style,{border:'1px solid #b4cbd2',background:'#243f4e',color:'#fff',borderRadius:'7px',padding:'6px 10px',cursor:'pointer'});
   close.addEventListener('click',()=>box.remove());
   function permitted(e){
     if(!e||!e.isConnected||box.contains(e))return false;
     if(e.matches&&e.matches(':disabled,[readonly]'))return false;
     const tag=e.tagName&&e.tagName.toLowerCase();
     if(tag==='input'&&!['text','number','search','url'].includes(e.type))return false;
     if(!['input','textarea'].includes(tag)&&!e.isContentEditable)return false;
     let label=(String(e.name||'')+' '+String(e.id||'')+' '+
       String(e.getAttribute('aria-label')||'')+' '+String(e.getAttribute('placeholder')||'')+
       ' '+String(e.getAttribute('autocomplete')||'')).toLowerCase();
     if(/passw|login|secret|token|private|credit|debit|bank|routing|social.security|tax.id|ssn|seed|wallet.key|signature|attest|certif|consent|payment|checkout|otp|verification.code|captcha/i.test(label))return false;
     return true;
   }
   document.addEventListener('focusin',e=>{if(permitted(e.target))lastTarget=e.target;},true);
   function fill(){
     try{
       const value=fields[chosen],target=lastTarget;
       if(typeof value!=='string')throw Error('Choose a populated text field.');
       if(!permitted(target))throw Error('Click a permitted text field on the page first.');
       if(value.length>200000)throw Error('Field exceeds safe transfer size.');
       if(target.isContentEditable){
         target.focus();target.textContent=value;
         target.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:value}));
       }else{
         const prototype=target.tagName.toLowerCase()==='textarea'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
         const setter=Object.getOwnPropertyDescriptor(prototype,'value').set;
         setter.call(target,value);
         target.dispatchEvent(new Event('input',{bubbles:true}));
         target.dispatchEvent(new Event('change',{bubbles:true}));
         target.focus();
       }
       output.textContent='Filled '+chosen+' in the selected field. Check the visible result before pressing ANY site save/submit control.';
     }catch(e){output.textContent='NOT FILLED: '+e.message;}
   }
   button.addEventListener('click',fill);
   document.addEventListener('keydown',e=>{
     if(!box.isConnected)return;
     if(e.altKey&&e.shiftKey&&e.code==='KeyV'){
       e.preventDefault();e.stopPropagation();fill();
     }
   },true);
   document.documentElement.appendChild(box);
 }
 $('inject').addEventListener('click',async()=>{
   try{
     const text=$('draft').value;
     if(text.length>5*1024*1024)throw Error('Draft too large. Export a smaller target JSON.');
     const data=JSON.parse(text);
     if(!data||data.schema!=='ttfes-btp.standalone.v1')throw Error('Paste a TTFES&BTP standalone destination JSON file.');
     if(!data.fields||typeof data.fields!=='object'||Array.isArray(data.fields))throw Error('Missing field map.');
     const fields={};
     for(const [name,value] of Object.entries(data.fields)){
       if(typeof value!=='string')throw Error('Non-text field '+name);
       if(!/^[a-z][a-z0-9_]{0,60}$/.test(name))throw Error('Unsafe field name.');
       if(value.length>200000)throw Error('Oversize field.');
       if(['certification','account_info','tax_info','residency'].includes(name))continue;
       fields[name]=value;
     }
     const tabs=await chrome.tabs.query({active:true,currentWindow:true});
     const tab=tabs[0];if(!tab||!tab.id)throw Error('No accessible active tab.');
     if(!/^https?:\/\//i.test(tab.url||''))throw Error('Open an HTTP(S) site that you control.');
     await chrome.scripting.executeScript({target:{tabId:tab.id},func:fieldHelper,args:[{fields}]});
     status('The field panel was opened on the selected page. Click a target input and fill deliberately. No remote submissions or payments.');
     $('draft').value='';
   }catch(error){status('NOT OPENED: '+error.message);}
 });
})();