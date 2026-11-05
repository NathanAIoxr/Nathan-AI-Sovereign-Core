(function(){
'use strict';
const shell=document.querySelector('.shell');
const toggle=document.getElementById('toggle-tools');
const message=document.getElementById('message');
if(!shell||!toggle||!message)return;
function setExpanded(expanded){
 shell.classList.toggle('advanced',Boolean(expanded));
 toggle.setAttribute('aria-expanded',String(Boolean(expanded)));
 toggle.textContent=expanded?'Hide tools':'Explore tools';
}
toggle.addEventListener('click',()=>setExpanded(!shell.classList.contains('advanced')));
document.addEventListener('keydown',event=>{
 if(event.key==='Escape'&&shell.classList.contains('advanced')&&event.target===toggle){
  setExpanded(false);
 }
});
setExpanded(false);
// Keep the input as the first action, but do not force focus back after a user clicks elsewhere.
if(!document.activeElement||document.activeElement===document.body){
 try{message.focus({preventScroll:true})}catch(_){message.focus()}
}
})();