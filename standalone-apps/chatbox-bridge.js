/* Standalone public source handoff -> HOP IN Chatbox.
 * Adds a draft only. No automated submission or transfer of private files.
 */
(function(){'use strict';
const KEY='nathan-ai.standalone-context.v1';
let raw;
try{raw=sessionStorage.getItem(KEY);if(raw)sessionStorage.removeItem(KEY)}catch(_){return}
if(!raw)return;
const input=document.getElementById('message'),heading=document.querySelector('.chat-heading');
if(!input||!heading)return;
function status(s){const p=document.createElement('p');p.className='muted';p.setAttribute('role','status');p.textContent=s;heading.append(p)}
try{
 if(raw.length>1400)throw Error('Handoff too large');
 const data=JSON.parse(raw);
 if(!data||data.schema!==KEY||typeof data.title!=='string'||data.title.length>240||
    typeof data.sourcePath!=='string'||data.sourcePath.length>260||
    !/^(?:app-factory\/|archive-index\/|index\.html$)/.test(data.sourcePath)||
    data.sourcePath.includes('..')||/[\\?#:%\x00-\x1f]/.test(data.sourcePath)||
    !data.sourcePath.endsWith('.html')||
    data.containsPrivateText!==false||data.modelRequestSent!==false)throw Error('Invalid public program context');
 const question='Continue working with the original Nathan AI program '+data.title+
  '. Original repository source: '+data.sourcePath+
  '. Keep its source unchanged and describe the independently linked standalone program, shared technology, games, books and educational uses without treating unfinished functions as finished.';
 if(!input.value.trim()){input.value=question;input.dispatchEvent(new Event('input',{bubbles:true}))}
 status('Standalone program title loaded for review. Nothing was sent to a model. Press Send yourself.');
}catch(e){status('Standalone handoff not accepted: '+e.message)}
})();