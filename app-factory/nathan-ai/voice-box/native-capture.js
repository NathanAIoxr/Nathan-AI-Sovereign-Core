/* Nathan AI Voice Box — foreground-only, opt-in recording, max 30s, no remote upload. */
(function(){'use strict';if(typeof document==='undefined')return;
const el=id=>document.getElementById(id);if(!el('captureStart'))return;
let recorder=null,stream=null,parts=[],last=null,lastURL=null,ending=false,watchdog=null;
const notice=s=>el('captureStatus').textContent=s;
function cleanupMic(){if(stream){for(const track of stream.getTracks())track.stop()}stream=null;if(watchdog){clearTimeout(watchdog);watchdog=null}}
function unload(){if(lastURL)URL.revokeObjectURL(lastURL);lastURL=null;last=null;el('capturePreview').pause();el('capturePreview').removeAttribute('src');el('capturePreview').load()}
function stop(){if(recorder&&recorder.state==='recording'){ending=true;recorder.stop();notice('Recording stopped. Finalizing in memory...')}cleanupMic()}
el('captureStart').onclick=async()=>{
 if(recorder?.state==='recording'){notice('Recorder already active.');return}
 if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined'){notice('This browser does not support explicit local microphone recording.');return}
 try{
  unload();parts=[];ending=false;
  stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true},video:false});
  const supported=['audio/webm;codecs=opus','audio/mp4','audio/webm'].find(t=>MediaRecorder.isTypeSupported(t));
  recorder=new MediaRecorder(stream,supported?{mimeType:supported}:undefined);
  recorder.ondataavailable=e=>{if(e.data&&e.data.size>0)parts.push(e.data)};
  recorder.onerror=()=>{cleanupMic();notice('Recording failed; microphone released.')};
  recorder.onstop=()=>{
   cleanupMic();
   last=new Blob(parts,{type:recorder?.mimeType||'audio/webm'});parts=[];
   if(last.size>0){lastURL=URL.createObjectURL(last);el('capturePreview').src=lastURL;
    notice('Local recording ready. Only your explicit Download saves it.')}
   else notice('No recording data captured.');
  };
  recorder.start(500);
  watchdog=setTimeout(stop,30000);
  notice('Microphone recording ON — foreground only; stops after 30 seconds or when the page is hidden.');
 }catch(err){cleanupMic();notice('Microphone not enabled: '+err.message)}
};
el('captureStop').onclick=stop;
el('captureDownload').onclick=()=>{if(!last||!lastURL){notice('Record something first.');return}
 const a=document.createElement('a');a.href=lastURL;a.download='nathan-owner-voice.'+(last.type.includes('mp4')?'m4a':'webm');a.click();notice('Recording saved locally by explicit action.')};
el('captureClear').onclick=()=>{stop();unload();parts=[];notice('Recorder and in-memory audio cleared.')};
document.addEventListener('visibilitychange',()=>{if(document.hidden&&recorder?.state==='recording')stop()});
window.addEventListener('pagehide',()=>{stop();unload()});
})();
