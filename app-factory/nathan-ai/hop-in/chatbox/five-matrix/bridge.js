(function(){
'use strict';
function init(){
 const open=document.getElementById('open-five-matrix'),close=document.getElementById('close-five-matrix'),dialog=document.getElementById('five-matrix-dialog'),frame=document.getElementById('five-matrix-frame');
 if(!open||!close||!dialog||!frame)return;
 open.addEventListener('click',()=>{if(typeof dialog.showModal==='function')dialog.showModal();else location.href='five-matrix/index.html';});
 close.addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
 window.addEventListener('message',event=>{
  if(event.source!==frame.contentWindow||event.origin!==location.origin)return;
  const packet=event.data;
  if(!packet||packet.type!=='nathan.five-matrix.prompt'||typeof packet.prompt!=='string'||packet.prompt.length>500)return;
  const message=document.getElementById('message');if(!message)return;
  // The educational app may prefill a question. It never automatically sends messages to a provider.
  message.value=packet.prompt;message.dispatchEvent(new Event('input',{bubbles:true}));
  dialog.close();message.focus();
  const status=document.getElementById('chat-status');if(status)status.textContent='Five-Matrix prompt prepared. Review it, then press Send.';
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();