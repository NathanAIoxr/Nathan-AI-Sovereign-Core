/* Nathan AI Voice Box — deterministic 16 kHz resampling + opt-in same-origin local API.
   Local server is contacted ONLY at http://127.0.0.1; HTTPS public app never contacts localhost. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.NathanNativeVoice=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
function isLoopbackOrigin(loc){return !!loc&&loc.protocol==='http:'&&loc.hostname==='127.0.0.1'}
function resample(pcm,rate,outRate=16000){
 if(!(pcm instanceof Float32Array)||pcm.length<1||pcm.length>192000*30)throw new RangeError('Invalid bounded input PCM');
 if(!Number.isFinite(rate)||rate<8000||rate>192000||outRate!==16000)throw new RangeError('Only input 8–192 kHz to 16 kHz is supported');
 if(pcm.length/rate>30.01)throw new RangeError('Only first 30 seconds may be processed');
 if(rate===outRate)return new Float32Array(pcm);
 const count=Math.max(1,Math.round(pcm.length*outRate/rate)),out=new Float32Array(count),ratio=rate/outRate;
 const cutoff=Math.min(1,1/ratio),radius=Math.ceil(9*Math.max(1,ratio));
 // Windowed-sinc lowpass before decimation: preserves spoken formants and reduces aliasing.
 for(let i=0;i<count;i++){
  const center=(i+.5)*ratio-.5,base=Math.floor(center);
  let sum=0,weights=0;
  for(let j=Math.max(0,base-radius);j<=Math.min(pcm.length-1,base+radius);j++){
   const d=j-center,unit=d*cutoff;
   const sinc=Math.abs(unit)<1e-10?1:Math.sin(Math.PI*unit)/(Math.PI*unit);
   const window=.5+.5*Math.cos(Math.PI*d/(radius+1));
   const w=sinc*window*cutoff;
   const x=pcm[j];if(!Number.isFinite(x))throw new RangeError('Unnormalized or invalid PCM');
   sum+=x*w;weights+=w;
  }
  out[i]=weights?Math.max(-1,Math.min(1,sum/weights)):0;
 }
 return out;
}
function mono(channels,count){
 if(!Array.isArray(channels)||!channels.length||channels.length>8)throw new RangeError('Between 1 and 8 channels required');
 const len=Math.min(count||channels[0].length,channels[0].length);
 if(!Number.isInteger(len)||len<1||len>192000*30)throw new RangeError('PCM sample limit exceeded');
 for(const channel of channels)if(!(channel instanceof Float32Array)||channel.length<len)throw new TypeError('PCM channels must align');
 const output=new Float32Array(len);for(let i=0;i<len;i++){
  let x=0;for(const channel of channels)x+=channel[i];output[i]=Math.max(-1,Math.min(1,x/channels.length))
 }
 return output;
}
function apiClient(context){
 const location=context.location,transport=context.fetch;
 if(!isLoopbackOrigin(location)||typeof transport!=='function')throw new Error('Native adapter only works when this page is served from http://127.0.0.1');
 let status=null;
 const req=async(url,options)=>{
  const r=await transport(url,{...options,credentials:'same-origin',cache:'no-store',redirect:'error'});
  if(!r.ok){let msg='Local speech service error';try{const body=await r.json();msg=body.error||msg}catch{}throw new Error(msg)}
  return r;
 };
 return Object.freeze({
  async connect(){
   const response=await req('/api/voice/status',{headers:{Accept:'application/json'}});
   const info=await response.json();
   if(info.schema!=='nathan.voice.native.v1'||info.localOnly!==true||typeof info.csrf!=='string')throw new Error('Unrecognized local speech service');
   status=info;return {...info,csrf:undefined};
  },
  async synthesize(text,voice='en',speed=175,pitch=50){
   if(!status)throw new Error('Connect to local native runtime first');
   const body=JSON.stringify({text,voice,speed,pitch});
   const response=await req('/api/voice/synthesize',{method:'POST',
     headers:{'Content-Type':'application/json','X-Nathan-Voice-CSRF':status.csrf},body});
   const b=await response.blob();if(b.size>3000000||b.size<44)throw new Error('Invalid speech output size');
   return b;
  },
  async transcribe(wav,language='auto'){
   if(!status)throw new Error('Connect to local native runtime first');
   if(!(wav instanceof ArrayBuffer)&&!(wav instanceof Uint8Array))throw new TypeError('WAV bytes required');
   if(wav.byteLength>1000100)throw new RangeError('Recording exceeds local 1 MB limit');
   const response=await req('/api/voice/transcribe',{method:'POST',
     headers:{'Content-Type':'audio/wav','X-Nathan-Language':language,'X-Nathan-Voice-CSRF':status.csrf},body:wav});
   const result=await response.json();if(typeof result.transcript!=='string')throw new Error('Invalid local transcript response');
   return result;
  }
 });
}
return Object.freeze({resample,mono,isLoopbackOrigin,apiClient});
});
(function(){'use strict';
 if(typeof document==='undefined')return;
 const V=window.NathanNativeVoice,N=window.NathanNoiseGate,el=id=>document.getElementById(id);
 if(!el('nativeConnect'))return;
 let client=null,lastBlob=null,lastURL=null;
 const set=msg=>{el('nativeStatus').textContent=msg};
 const local=V.isLoopbackOrigin(window.location);
 if(!local){set('Public/offline browser mode. Start the optional local server on your own computer and reopen its http://127.0.0.1 link to unlock native synthesis and transcription.');return}
 try{client=V.apiClient({location:window.location,fetch:window.fetch.bind(window)})}catch(err){set(err.message);return}
 async function connect(){try{const r=await client.connect();
  el('nativeVoice').replaceChildren();for(const voice of r.voices){const option=document.createElement('option');option.value=voice;option.textContent=voice;el('nativeVoice').append(option)}
  set('Local service connected. eSpeak NG '+(r.engines.espeak?'installed':'missing')+'; whisper.cpp + model '+(r.engines.whisper?'installed':'missing')+'. No network provider.');
  return r;
 }catch(err){set(err.message);return null}}
 el('nativeConnect').onclick=connect;
 function revoke(){if(lastURL){URL.revokeObjectURL(lastURL);lastURL=null}lastBlob=null;el('nativePreview').removeAttribute('src');el('nativePreview').load()}
 el('nativeSpeak').onclick=async()=>{
  revoke();try{
   if(!el('nativeVoice').value)throw new Error('Connect and select an installed local voice');
   const text=el('speechText').value,voice=el('nativeVoice').value;
   const blob=await client.synthesize(text,voice,Number(el('nativeSpeed').value),Number(el('nativePitch').value));
   lastBlob=blob;lastURL=URL.createObjectURL(blob);el('nativePreview').src=lastURL;
   await el('nativePreview').play().catch(()=>{});set('Device-created WAV ready. Press Download to keep a copy; no cloud calls.');
  }catch(err){set(err.message)}
 };
 el('nativeDownload').onclick=()=>{
  if(!lastBlob||!lastURL){set('Generate speech locally before downloading.');return}
  const a=document.createElement('a');a.href=lastURL;a.download='nathan-local-speech.wav';a.click();set('WAV downloaded by explicit action.')
 };
 el('nativeTranscribe').onclick=async()=>{
  const file=el('nativeFile').files?.[0];
  if(!file){set('Choose a local audio file first.');return}
  if(file.size>12*1024*1024){set('Audio file exceeds local 12 MB input limit.');return}
  if(!client){set('Start local server first.');return}
  const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio){set('Web Audio unavailable.');return}
  let ac=null;
  try{
   ac=new Audio();const audio=await ac.decodeAudioData(await file.arrayBuffer());
   const frames=Math.min(audio.length,Math.floor(audio.sampleRate*30));
   const channels=Array.from({length:Math.min(audio.numberOfChannels,8)},(_,i)=>audio.getChannelData(i));
   const joined=V.mono(channels,frames),pcm=V.resample(joined,audio.sampleRate);
   const wav=N.wav(pcm,16000);
   set('Transcribing '+(pcm.length/16000).toFixed(1)+' seconds on this computer using installed whisper.cpp...');
   const result=await client.transcribe(wav,el('nativeLanguage').value);
   el('nativeTranscript').value=result.transcript;
   set('Local transcription returned. Review every word before using it; the original recording was not changed.')
  }catch(err){set('Native transcription unavailable: '+err.message)}
  finally{if(ac)await ac.close().catch(()=>{})}
 };
 el('nativeAppend').onclick=()=>{
  const s=el('nativeTranscript').value;if(!s.trim()){set('No transcript to append.');return}
  if(!window.confirm('Append the local transcript to your exact original speech text?'))return;
  el('speechText').value+=el('speechText').value?'\n'+s:s;
  el('speechText').dispatchEvent(new Event('input',{bubbles:true}));
  set('Reviewed transcript appended. Earlier original text preserved.')
 };
 el('nativeClear').onclick=()=>{revoke();el('nativeTranscript').value='';el('nativeFile').value='';set('Native results cleared from browser memory.')};
 window.addEventListener('pagehide',revoke);
})();
