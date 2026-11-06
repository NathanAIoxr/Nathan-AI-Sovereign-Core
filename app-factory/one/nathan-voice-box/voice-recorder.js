"use strict";
// Nathan AI on-device voice enrollment. Recording, decoding, FFT, vault encryption,
// and local selection happen in this browser. Speech cloning is opt-in via loopback.
(() => {
  const $=id=>document.getElementById(id), storage=window.NathanVoiceStore;
  const token=document.querySelector('meta[name="local-session"]').content;
  const MAX_RECORD_SECONDS=45, MAX_REFERENCE_SECONDS=12;
  let stream=null, recorder=null, chunks=[], timeout=null, activeReference=null;
  let selectedProfile=null, worker=null, workerCounter=0, currentRecURL=null;
  const status=msg=>{$("record-status").textContent=msg;};

  function stopMicrophone(){
    if(timeout){clearTimeout(timeout);timeout=null;}
    if(recorder && recorder.state!=="inactive"){recorder.stop();}
    if(stream){for(const track of stream.getTracks())track.stop();stream=null;}
    $("record-start").disabled=false;
    $("record-stop").disabled=true;
  }
  async function analyzeInWorker(samples,sampleRate){
    if(worker)worker.terminate();
    worker=new Worker("/mapper-worker.js");
    const id=++workerCounter;
    return new Promise((resolve,reject)=>{
      worker.onmessage=event=>{
        if(event.data.id!==id)return;
        worker.terminate();worker=null;
        if(event.data.ok)resolve(event.data.result);
        else reject(Error(event.data.error||"Analysis failed"));
      };
      worker.onerror=event=>{worker.terminate();worker=null;reject(Error(event.message||"Mapper unavailable"));};
      worker.postMessage({id,kind:"analyze",samples,sampleRate},[samples.buffer]);
    });
  }
  function wavFromPCM(pcm,rate=16000){
    const buf=new ArrayBuffer(44+pcm.length*2),v=new DataView(buf);
    const ascii=(at,text)=>{for(let i=0;i<text.length;i++)v.setUint8(at+i,text.charCodeAt(i));};
    ascii(0,"RIFF");v.setUint32(4,36+pcm.length*2,true);ascii(8,"WAVE");
    ascii(12,"fmt ");v.setUint32(16,16,true);v.setUint16(20,1,true);
    v.setUint16(22,1,true);v.setUint32(24,rate,true);v.setUint32(28,rate*2,true);
    v.setUint16(32,2,true);v.setUint16(34,16,true);ascii(36,"data");
    v.setUint32(40,pcm.length*2,true);
    for(let i=0;i<pcm.length;i++){
      const s=Math.max(-1,Math.min(1,pcm[i]));
      v.setInt16(44+i*2,s<0?Math.round(s*32768):Math.round(s*32767),true);
    }
    return new Uint8Array(buf);
  }
  async function processRecording(blob){
    if(blob.size>25*1024*1024)throw Error("Audio is too large for local voice mapping");
    const context=new AudioContext(),bytes=await blob.arrayBuffer();
    try {
      const decoded=await context.decodeAudioData(bytes.slice(0));
      if(decoded.duration>MAX_RECORD_SECONDS+2)throw Error("Recording exceeds 45 seconds");
      if(decoded.duration<1.5)throw Error("Record at least two seconds");
      const samples=new Float32Array(decoded.length);
      for(let ch=0;ch<decoded.numberOfChannels;ch++){
        const channel=decoded.getChannelData(ch);
        for(let i=0;i<samples.length;i++)samples[i]+=channel[i]/decoded.numberOfChannels;
      }
      const reference=window.NathanVoiceMapper.resample(samples,decoded.sampleRate);
      activeReference=wavFromPCM(reference.subarray(0,Math.round(MAX_REFERENCE_SECONDS*16000)));
      const result=await analyzeInWorker(samples,decoded.sampleRate);
      showMetrics(result);
      $("record-save").disabled=false;
      $("clone-voice").disabled=false;
      status("Voice mapped locally: "+result.duration_seconds+"s. No audio was uploaded.");
      return result;
    } finally {await context.close();}
  }
  function showMetrics(profile){
    $("profile-metrics").replaceChildren();
    const data=[
      ["Duration",profile.duration_seconds+" s"],
      ["Median pitch",profile.median_f0_hz===null?"Unresolved":profile.median_f0_hz+" Hz"],
      ["Pitch range (10–90%)",profile.p10_f0_hz===null?"Unresolved":profile.p10_f0_hz+"–"+profile.p90_f0_hz+" Hz"],
      ["RMS signal",profile.rms],
      ["Measured brightness",profile.mean_band_centroid_hz+" Hz (band approximation)"],
      ["Rhythmic onset proxy",profile.rhythm_onset_proxy_per_minute+" / minute"],
      ["Clipped samples",profile.clipped_percent+"%"],
      ["Voiced windows",profile.voiced_frames_sampled+" / "+profile.measured_frames],
    ];
    for(const [key,value] of data){
      const row=document.createElement("div");row.className="metric-row";
      const a=document.createElement("span");a.textContent=key;
      const b=document.createElement("strong");b.textContent=String(value);
      row.append(a,b);$("profile-metrics").append(row);
    }
    const canvas=$("record-gates"),ctx=canvas.getContext("2d");
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle="#081c26";ctx.fillRect(0,0,canvas.width,canvas.height);
    profile.spectral_gate_shares.forEach((share,index)=>{
      const column=canvas.width/12,height=Math.sqrt(Math.max(0,share))*150;
      ctx.fillStyle="#88e5ee";ctx.fillRect(column*index+8,canvas.height-28-height,column-16,height);
      ctx.fillStyle="#bbd8dd";ctx.font="12px system-ui";ctx.textAlign="center";
      ctx.fillText(String(index+1),column*(index+0.5),canvas.height-10);
    });
    $("profile-interpretation").textContent=profile.interpretation;
  }
  let lastProfile=null;
  async function handleBlob(blob){
    try{
      if(currentRecURL)URL.revokeObjectURL(currentRecURL);
      currentRecURL=URL.createObjectURL(blob);
      $("record-playback").src=currentRecURL;
      status("Measuring local voice sample…");
      lastProfile=await processRecording(blob);
    }catch(error){status("Recording could not be mapped: "+error.message);}
  }
  $("record-start").addEventListener("click",async()=>{
    if(!$("consent-self").checked){
      status("Confirm you are the speaker and authorize local recording before starting.");return;
    }
    if(!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder){
      status("This browser does not support microphone recording on a secure local origin.");return;
    }
    try {
      activeReference=null;lastProfile=null;$("record-save").disabled=true;$("clone-voice").disabled=true;
      stream=await navigator.mediaDevices.getUserMedia({audio:{
        channelCount:1,echoCancellation:false,noiseSuppression:false,autoGainControl:false
      },video:false});
      recorder=new MediaRecorder(stream);chunks=[];
      recorder.addEventListener("dataavailable",e=>{if(e.data?.size)chunks.push(e.data);});
      recorder.addEventListener("stop",()=>{
        const blob=new Blob(chunks,{type:recorder.mimeType||"audio/webm"});
        chunks=[];void handleBlob(blob);
      },{once:true});
      recorder.start();
      $("record-start").disabled=true;$("record-stop").disabled=false;
      status("Recording microphone locally. Read the exact reference words shown below.");
      timeout=setTimeout(stopMicrophone,MAX_RECORD_SECONDS*1000);
    }catch(error){stopMicrophone();status("Microphone permission or device unavailable: "+error.message);}
  });
  $("record-stop").addEventListener("click",stopMicrophone);
  const enc=new TextEncoder();
  async function encryptLocal(payload,pass){
    const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));
    const keyBase=await crypto.subtle.importKey("raw",enc.encode(pass),"PBKDF2",false,["deriveKey"]);
    const key=await crypto.subtle.deriveKey({name:"PBKDF2",salt,iterations:250000,hash:"SHA-256"},keyBase,
      {name:"AES-GCM",length:256},false,["encrypt"]);
    const cipher=await crypto.subtle.encrypt({name:"AES-GCM",iv},key,payload);
    return {salt:Array.from(salt),iv:Array.from(iv),cipher:new Uint8Array(cipher),kdf:"PBKDF2-SHA256-250000",encryption:"AES-256-GCM"};
  }
  async function decryptLocal(packed,pass){
    const base=await crypto.subtle.importKey("raw",enc.encode(pass),"PBKDF2",false,["deriveKey"]);
    const key=await crypto.subtle.deriveKey({name:"PBKDF2",salt:new Uint8Array(packed.salt),
      iterations:250000,hash:"SHA-256"},base,{name:"AES-GCM",length:256},false,["decrypt"]);
    return new Uint8Array(await crypto.subtle.decrypt({name:"AES-GCM",
      iv:new Uint8Array(packed.iv)},key,packed.cipher));
  }
  async function refreshProfiles(){
    const all=await storage.all("profiles"),list=$("profile-list");list.replaceChildren();
    all.sort((a,b)=>b.created.localeCompare(a.created));
    for(const item of all){
      const opt=document.createElement("option");opt.value=item.id;
      opt.textContent=item.name+" — "+item.lang+(item.dialect?" · "+item.dialect:"")+
        (item.encrypted_audio?" 🔒":" · metrics only");
      list.append(opt);
    }
    $("profile-count").textContent=all.length+" profiles stored in this browser's IndexedDB. Acoustic metadata is not encrypted.";
  }
  $("record-save").addEventListener("click",async()=>{
    if(!lastProfile||!$("consent-self").checked)return status("Record and map your own voice first.");
    const name=$("profile-name").value.trim(),lang=$("lang").value.trim(),
      dialect=$("profile-dialect").value.trim(),transcript=$("reference-transcript").value.trim();
    if(name.length<2||name.length>100||dialect.length>120||
       !/^[A-Za-z]{2,8}(?:-[A-Za-z0-9]{1,8})*$/.test(lang))
      return status("Enter a valid name (2–100 characters), language tag and optional dialect.");
    if(transcript.length>2000)return status("Transcript cannot exceed 2,000 characters");
    let encrypted_audio=null;
    if($("remember-audio").checked){
      const pass=$("voice-passphrase").value;
      if(pass.length<12)return status("Use a passphrase of at least 12 characters for encrypted audio storage.");
      if(!activeReference)return status("Voice recording is unavailable; record again.");
      encrypted_audio=await encryptLocal(activeReference,pass);
    }
    const item={id:crypto.randomUUID(),name,lang,dialect,transcript,
      created:new Date().toISOString(),metrics:lastProfile,encrypted_audio,
      consent_self:true,claim:"recorded by the person operating this device"};
    try{
      await storage.put("profiles",item);selectedProfile=item;
      status("Saved local voice map"+(encrypted_audio?" with AES-GCM encrypted reference audio.":". Reference audio not persisted."));
      await refreshProfiles();
    }catch(error){status("Local profile could not be saved: "+error.message);}
  });
  $("profile-list").addEventListener("change",async()=>{
    const item=await storage.get("profiles",$("profile-list").value);
    if(!item)return;
    selectedProfile=item;
    showMetrics(item.metrics);
    $("profile-name").value=item.name;$("lang").value=item.lang;
    $("profile-dialect").value=item.dialect||"";
    $("reference-transcript").value=item.transcript||"";
    activeReference=null;
    status(item.encrypted_audio?"Saved encrypted voice: enter its passphrase and choose Unlock.":"Saved metrics only: new recording needed for cloning.");
  });
  $("profile-unlock").addEventListener("click",async()=>{
    if(!selectedProfile?.encrypted_audio)return status("This profile has no encrypted reference audio.");
    try{
      const pass=$("voice-passphrase").value;
      activeReference=await decryptLocal(selectedProfile.encrypted_audio,pass);
      $("clone-voice").disabled=false;
      status("Reference audio decrypted for this session. It remains on this device.");
    }catch(e){activeReference=null;status("Unable to unlock audio. Check passphrase.");}
  });
  $("profile-delete").addEventListener("click",async()=>{
    const id=$("profile-list").value;
    if(!id)return;
    await storage.remove("profiles",id);
    if(selectedProfile?.id===id){selectedProfile=null;activeReference=null;lastProfile=null;$("clone-voice").disabled=true;}
    await refreshProfiles();status("Local profile deleted from this browser. No cloud copy was created.");
  });
  const base64=bytes=>{
    let text="";
    for(let i=0;i<bytes.length;i+=4096)text+=String.fromCharCode(...bytes.subarray(i,i+4096));
    return btoa(text);
  };
  $("clone-voice").addEventListener("click",async()=>{
    if(!$("consent-self").checked)return status("Confirm this is your voice and your authorized recording.");
    if(!activeReference)return status("Record yourself or unlock an encrypted reference.");
    const pack=$("clone-pack").value.trim(),text=$("text").value.trim(),
      transcript=$("reference-transcript").value.trim(),lang=$("lang").value.trim();
    if(!/^[A-Za-z0-9_-]{1,64}$/.test(pack))
      return status("Select an installed authorized ZipVoice pack ID.");
    if(transcript.length<3||transcript.length>2000||text.length<1||text.length>4000)
      return status("Enter the exact recorded transcript and the words to synthesize.");
    const btn=$("clone-voice");btn.disabled=true;status("Running local reference-based synthesis…");
    try{
      const response=await fetch("/clone",{
        method:"POST",headers:{"Content-Type":"application/json","X-Local-Session":token},
        body:JSON.stringify({pack,text,reference_text:transcript,lang,
          speaker_authorized:true,reference_wav_base64:base64(activeReference)}),
        cache:"no-store"});
      if(!response.ok){const error=await response.json();throw Error(error.error||"Local cloning unavailable");}
      const wav=await response.blob();
      if(window.NathanVoiceBoxSetAudio)window.NathanVoiceBoxSetAudio(wav,"Authorized local voice synthesis");
      status("Generated on this device using the locally installed reference-voice model. Synthetic output.");
    }catch(error){status("Unable to synthesize: "+error.message);}
    finally{btn.disabled=false;}
  });
  window.addEventListener("beforeunload",()=>{
    stopMicrophone();
    if(worker)worker.terminate();
    if(currentRecURL)URL.revokeObjectURL(currentRecURL);
    activeReference=null;
  });
  refreshProfiles().catch(e=>status("Browser-profile storage unavailable: "+e.message));
})();
