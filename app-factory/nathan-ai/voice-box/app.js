/* Nathan AI Voice Box: explicit, browser-reported local voices, local dictation only, no cloud fallback. */
(function(){'use strict';
const P=window.NathanVoicePolicy,N=window.NathanNoiseGate,M=window.NathanMacroSound,$=id=>document.getElementById(id);
let voices=[],speaking=false,rec=null,audioURL=null,memo=null,macroContext=null,macroSession=null;
const speech=window.speechSynthesis||null,Speech=window.SpeechSynthesisUtterance||null,ASR=window.SpeechRecognition||null;
const state=(id,msg)=>{$(id).textContent=msg};
function refreshVoices(){
 voices=P.localVoices(speech?.getVoices?.()||[]);
 const sel=$('voice'),before=sel.value;sel.replaceChildren();
 for(const v of voices){const o=document.createElement('option');o.value=v.id;o.textContent=v.lang+' — '+v.name;sel.appendChild(o)}
 if(voices.some(x=>x.id===before))sel.value=before;
 state('voiceStatus',voices.length?voices.length+' browser-reported local voices detected. No remote voices shown.':'No local speech voice reported. Install OS voices or use the separate offline eSpeak NG CLI.');
 $('voiceCount').textContent=voices.length;
 showFootprint();
}
function chosen(){return voices.find(x=>x.id===$('voice').value)}
function showFootprint(){
 const f=P.footprint($('speechText').value);
 state('bytes',String(f.textBytes));
 state('footprint','App requests: '+f.outboundAudioBytes+' outbound audio bytes, '+f.outboundTextBytes+' outbound text bytes, '+f.cloudInferenceCalls+' cloud model calls. Local browser speech service behavior is reported by the OS/browser; test in airplane mode.');
}
const styles={
 neutral:{rate:1,pitch:1},
 'ancestor-story':{rate:.90,pitch:1},
 'ancient-story':{rate:.92,pitch:.94},
 mythic:{rate:.85,pitch:.83}
};
function stopSpeech(){speech?.cancel();speaking=false;state('speechStatus','Speech canceled.');}
function speakNow(){
 if(!speech||!Speech){state('speechStatus','Speech synthesis not supported on this device.');return}
 let plan;
 try{const mode=$('style').value,style=styles[mode]||styles.neutral;
 plan=P.buildPlan($('speechText').value,chosen(),{rate:style.rate*Number($('rate').value),pitch:style.pitch,volume:Number($('volume').value)});
 }catch(err){state('speechStatus',err.message);return}
 stopSpeech();speaking=true;let index=0;
 function next(){if(!speaking)return;if(index>=plan.chunks.length){speaking=false;state('speechStatus','Local playback completed.');return}
 const utterance=new Speech(plan.chunks[index++]);utterance.voice=plan.voice;utterance.lang=plan.lang;utterance.rate=plan.rate;utterance.pitch=plan.pitch;utterance.volume=plan.volume;
 utterance.onend=()=>{if(speaking)next()};utterance.onerror=e=>{speaking=false;state('speechStatus','Stopped: '+String(e.error||'browser audio issue'))};
 speech.speak(utterance);state('speechStatus','Speaking chunk '+index+' of '+plan.chunks.length+' using '+plan.lang+' local voice');}
 next();
}
async function getLocalRecognitionStatus(){
 if(!ASR||typeof ASR.available!=='function'){state('dictationStatus','Browser has no verifiable on-device recognition API. No remote fallback.');return null}
 let lang;try{lang=P.locale($('dictationLang').value)}catch(err){state('dictationStatus',err.message);return null}
 try{const result=await ASR.available({langs:[lang],processLocally:true});
 state('dictationStatus','On-device '+lang+' recognition: '+result+'. Network speech recognition is disabled.');
 return {result,lang};
 }catch(err){state('dictationStatus','Device recognition query unavailable: '+err.message);return null}
}
async function installLanguagePack(){
 if(typeof ASR?.install!=='function'){state('dictationStatus','Local installation not supported in this browser. No network fallback.');return}
 const result=await getLocalRecognitionStatus();if(!result)return;
 if(result.result==='available'){state('dictationStatus','On-device language pack already available.');return}
 try{state('dictationStatus','Installing optional OS/browser language pack with your explicit action.');
 const installed=await ASR.install({langs:[result.lang],processLocally:true});
 state('dictationStatus',installed?'Local pack reported installed. Check availability again.':'Local pack unavailable or installation declined.');
 }catch(err){state('dictationStatus','Pack installation failed: '+err.message)}
}
async function startDictation(){
 const status=await getLocalRecognitionStatus();
 if(!status||status.result!=='available'){state('dictationStatus','No locally installed recognition pack. Remote recognition remains blocked.');return}
 if(rec){state('dictationStatus','Dictation already running.');return}
 try{
  rec=new ASR();if(!('processLocally' in rec))throw Error('The local-only switch is unsupported');
  rec.processLocally=true;if(rec.processLocally!==true)throw Error('Local-only recognition not enforced');
  rec.lang=status.lang;rec.continuous=false;rec.interimResults=false;rec.maxAlternatives=1;
  rec.onresult=e=>{const text=e.results?.[0]?.[0]?.transcript||'';
   if(text){$('dictated').value+=($('dictated').value?'\n':'')+text;state('dictationStatus','Local recognition complete. Dictation stays separate from the original text.')}};
  rec.onerror=e=>state('dictationStatus','Local dictation stopped: '+String(e.error||'unavailable'));
  rec.onend=()=>{rec=null};
  rec.start();state('dictationStatus','Microphone requested for one on-device dictation session. Use Stop to end.');
 }catch(err){rec=null;state('dictationStatus','Dictation blocked: '+err.message)}
}
function stopDictation(){if(rec){rec.abort();rec=null}state('dictationStatus','Dictation stopped.')}
async function cleanAudio(){
 const file=$('noiseInput').files?.[0];if(!file){state('noiseStatus','Select an audio file first.');return}
 if(file.size>12*1024*1024){state('noiseStatus','Local audio input limit: 12 MB.');return}
 const C=window.AudioContext||window.webkitAudioContext;if(!C){state('noiseStatus','Web Audio not supported.');return}
 let ac=null;
 try{ac=new C();const decoded=await ac.decodeAudioData(await file.arrayBuffer());
  if(decoded.duration>120)throw Error('Input must be no more than 120 seconds');
  const count=Math.min(decoded.getChannelData(0).length,Math.floor(decoded.sampleRate*30),5000000);
  const input=decoded.getChannelData(0).slice(0,count);
  const gate=N.process(input,decoded.sampleRate,Number($('threshold').value));
  const wav=N.wav(gate.samples,decoded.sampleRate);
  const url=URL.createObjectURL(new Blob([wav],{type:'audio/wav'}));const a=document.createElement('a');a.href=url;
  a.download=(file.name.replace(/\.[^.]+$/,'')||'sound')+'-nathan-noise-gated.wav';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
  state('noiseStatus','Local first-channel, first-'+(count/decoded.sampleRate).toFixed(1)+'s amplitude gate complete; original unchanged. Quiet-frame fraction '+gate.quietFraction.toFixed(3)+'. This is NOT neural denoising.');
 }catch(err){state('noiseStatus','Unable to process: '+err.message)}
 finally{if(ac)await ac.close().catch(()=>{})}
}
function clearFamily(){
 const a=$('familyAudio');a.pause();a.removeAttribute('src');a.load();
 if(audioURL)URL.revokeObjectURL(audioURL);audioURL=null;state('familyStatus','No family recording retained.');
}
function playFamily(){
 const f=$('familyFile').files?.[0],kind=$('rights').value;
 try{if(!f||f.size>20*1024*1024)throw Error('Select an authorized audio file of at most 20 MB');
  if(!/^audio\//.test(f.type))throw Error('Select an audio recording');
  const r=P.rights(kind,$('rightsOK').checked);if(!r.allowed)throw Error(r.warning);
  clearFamily();audioURL=URL.createObjectURL(f);
  $('familyAudio').src=audioURL;$('familyAudio').play().catch(()=>{});
  state('familyStatus','Playing a supplied recording, not generating a cloned voice. Nothing uploaded or saved.');
 }catch(err){state('familyStatus',err.message)}
}
async function playMacro(){
 try{
 const C=window.AudioContext||window.webkitAudioContext;if(!C)throw Error('Web Audio not supported');
 if(macroSession)macroSession.stop();if(!macroContext||macroContext.state==='closed')macroContext=new C();
 await macroContext.resume();macroSession=M.play(macroContext,$('ambient').value,Number($('ambientVolume').value));
 state('macroStatus',macroSession.preset.description+'; stops after '+macroSession.preset.dur+' seconds.');
 }catch(err){state('macroStatus',err.message)}
}
$('speak').onclick=speakNow;$('stopSpeech').onclick=stopSpeech;
$('speechText').addEventListener('input',showFootprint);
$('rate').oninput=()=>state('rateValue',$('rate').value+'×');
$('volume').oninput=()=>state('volumeValue',String(Math.round($('volume').value*100))+'%');
$('ambientVolume').oninput=()=>state('ambientValue',String(Math.round($('ambientVolume').value*100))+'%');
$('checkPack').onclick=getLocalRecognitionStatus;$('installPack').onclick=installLanguagePack;
$('startDictation').onclick=startDictation;$('stopDictation').onclick=stopDictation;
$('useDictation').onclick=()=>{if(!$('dictated').value.trim()){state('dictationStatus','No dictated text to insert.');return}
 if(confirm('Append this locally recognized text to the speech input?')){$('speechText').value+=($('speechText').value?'\n':'')+$('dictated').value;showFootprint();state('dictationStatus','Dictation appended. Original earlier text preserved.')}}
$('clearDictation').onclick=()=>{$('dictated').value='';state('dictationStatus','Unsaved dictation cleared.')};
$('cleanNoise').onclick=cleanAudio;$('threshold').oninput=()=>state('thresholdValue',$('threshold').value);
$('playFamily').onclick=playFamily;$('clearFamily').onclick=clearFamily;$('playMacro').onclick=playMacro;
$('stopMacro').onclick=()=>{if(macroSession)macroSession.stop();macroSession=null;state('macroStatus','Synthetic ambience stopped.')};
$('offline').onclick=async()=>{if(!('serviceWorker' in navigator)){state('offlineStatus','Offline caching unsupported in this browser');return}
 try{await navigator.serviceWorker.register('./sw.js',{scope:'./'});state('offlineStatus','Offline app shell registered. Local voice/language packs are separate OS/browser installations.')}catch(err){state('offlineStatus',err.message)}};
$('clear').onclick=()=>{stopSpeech();stopDictation();clearFamily();$('familyFile').value='';$('rightsOK').checked=false;$('noiseInput').value='';$('speechText').value='';$('dictated').value='';state('noiseStatus','No file retained.');showFootprint();state('speechStatus','In-memory text and playback cleared.')};
$('archetypeInfo').textContent='Storytelling styles alter pacing/pitch of the installed generic voice only. They cannot reconstruct a historical or deceased person’s authentic voice.';
if(speech){refreshVoices();speech.addEventListener?.('voiceschanged',refreshVoices)}else state('voiceStatus','Browser speech synthesis unavailable. Use the optional local native CLI.');
showFootprint();
})();