/* Context-only handoff into original HOP IN Interactive Chatbox.
 * Does not transfer private manuscripts or silently send a model request.
 */
(function(){'use strict';
const E=window.NathanIndependentEngine,R=window.NathanIndependentRegistry;
if(!E||!R)return;
let raw=null;
try{raw=sessionStorage.getItem(E.BRIDGE);if(raw)sessionStorage.removeItem(E.BRIDGE)}catch{return}
if(!raw)return;
const input=document.getElementById('message');if(!input)return;
function notice(message){
 const wrap=document.createElement('p');wrap.className='muted';wrap.setAttribute('role','status');
 wrap.textContent=message;
 const header=document.querySelector('.chat-heading');if(header)header.append(wrap);
}
try{
 if(raw.length>1500)throw Error('Handoff too large');
 const packet=E.validateHandoff(JSON.parse(raw)),source=R.find(packet.id);
 if(!source||packet.title!==source.title)throw Error('Unknown or altered source identity');
 const draft='Continue with the independent original Nathan AI program: '+packet.title+
  '. Edition: '+packet.form+'. Preserve its original words and source independently; share technology by reference, identify unfinished features, and distinguish derived app/game/book/academy work from author originals.';
 if(!input.value.trim()){input.value=draft;input.dispatchEvent(new Event('input',{bubbles:true}));}
 notice('Original program context loaded for your review: '+packet.title+'. Nothing was sent. Press Send yourself.');
}catch(e){notice('Independent edition context was not imported: '+e.message)}
})();