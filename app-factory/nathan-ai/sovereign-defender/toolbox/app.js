/* Browser-local interface. No network calls, automatic permissions, or file writes. */
(function(){'use strict';const E=window.NathanDefenseToolbox;
const $=id=>document.getElementById(id);let last=null,events=[];
function output(id,v){$(id).textContent=typeof v==='string'?v:JSON.stringify(v,null,2);if(v&&typeof v==='object')last=v}
function run(id,fn){try{output(id,fn());$('generalStatus').textContent='Local result ready; no external action performed.'}catch(e){output(id,'Review could not run: '+e.message)}}
function exportJson(value,name){
 const blob=new Blob([JSON.stringify(value,null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;
 document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
$('runLink').addEventListener('click',()=>run('linkOut',()=>E.reviewLink($('linkInput').value)));
$('runPerm').addEventListener('click',()=>run('permOut',()=>E.reviewPermission({app:$('permApp').value,permission:$('permKind').value,scope:$('permScope').value,reason:$('permReason').value})));
$('runBackup').addEventListener('click',()=>run('backupOut',()=>E.reviewBackups({
 copies:Number($('copies').value),media:Number($('media').value),
 offsite:$('offsite').checked,offline:$('offline').checked,
 restoreTested:$('restoreTested').checked,versioned:$('versioned').checked,keyRecovery:$('keyRecovery').checked})));
$('runHash').addEventListener('click',async()=>{
 const file=$('hashFile').files&&$('hashFile').files[0];if(!file){output('hashOut','Choose one file first.');return}
 if(file.size>12*1024*1024){output('hashOut','Select a file of 12 MiB or less.');return}
 try{
  const buffer=await file.arrayBuffer(),digest=await crypto.subtle.digest('SHA-256',buffer);
  const sha=Array.from(new Uint8Array(digest)).map(x=>x.toString(16).padStart(2,'0')).join('');
  output('hashOut',E.reviewFingerprint(file.name,sha,$('previousHash').value));
 }catch(e){output('hashOut','Fingerprint not available: '+e.message)}
});
function showEvents(){const log=E.incidentLog(events);output('eventOut',log);$('eventStatus').textContent=events.length+' owner-entered timeline events.';return log}
$('addEvent').addEventListener('click',()=>{try{
 const pending=events.concat([{observed:$('eventTime').value,type:$('eventType').value,details:$('eventDetails').value}]);
 E.incidentLog(pending);events=pending;showEvents();$('eventDetails').value='';
 }catch(e){$('eventStatus').textContent=e.message}});
$('saveIncident').addEventListener('click',()=>{try{exportJson(E.incidentLog(events),'nathan-ai-private-incident-timeline.json');$('eventStatus').textContent='Private JSON downloaded if your browser allowed the download.'}catch(e){$('eventStatus').textContent=e.message}});
$('clearIncident').addEventListener('click',()=>{events=[];showEvents();$('eventStatus').textContent='Only the in-memory timeline was cleared; exported copies remain unchanged.'});
$('exportLast').addEventListener('click',()=>{if(last)exportJson(last,'nathan-ai-defense-review.json');else $('generalStatus').textContent='Run a tool before exporting.'});
})();