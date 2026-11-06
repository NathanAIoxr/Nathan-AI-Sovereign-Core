"use strict";
const $ = (id) => document.getElementById(id);
const token = document.querySelector('meta[name="local-session"]').content;
let currentAudioURL = null, currentArchiveURL = null;
const setStatus = (message) => { $("status").textContent = message; };
async function init() {
  try {
    const response = await fetch("/voices", {cache:"no-store"});
    const data = await response.json();
    const select = $("voice");
    select.replaceChildren();
    for (const voice of data.voices) {
      const opt = document.createElement("option");
      opt.value = voice.name;
      opt.dataset.lang = voice.language;
      opt.textContent = voice.name + " · " + voice.language;
      if (voice.language.toLowerCase() === "en-us") opt.selected = true;
      select.append(opt);
    }
    if (data.voices.length) {
      setStatus(data.voices.length + " installed voice choices detected. Ready to synthesize offline.");
    } else {
      const opt = document.createElement("option");
      opt.value = "en-us"; opt.textContent = "No engine detected"; select.append(opt);
      setStatus("No local speech engine found. Install espeak-ng, or configure an authorized ONNX pack.");
    }
  } catch (e) { setStatus("Local engine unavailable: " + e.message); }
}
$("speak").addEventListener("click", async () => {
  const button = $("speak");
  button.disabled = true;
  setStatus("Generating on this device…");
  try {
    const obj = {
      text: $("text").value, lang: $("lang").value.trim(),
      voice: $("voice").value, persona: $("persona").value,
      effect: $("effect").value, pack: $("pack").value.trim() || null
    };
    const resp = await fetch("/speak", {
      method:"POST",headers:{"Content-Type":"application/json","X-Local-Session":token},
      body:JSON.stringify(obj),cache:"no-store"
    });
    if (!resp.ok) {
      const error = await resp.json();
      throw new Error(error.error || "Local engine error");
    }
    const blob = await resp.blob();
    if (currentAudioURL) URL.revokeObjectURL(currentAudioURL);
    currentAudioURL = URL.createObjectURL(blob);
    $("player").src = currentAudioURL;
    $("download").href = currentAudioURL;
    $("download").hidden = false;
    renderEarGates(blob).catch(e => { $("ear-gates-label").textContent = "Graph unavailable: " + e.message; });
    setStatus("Done locally. " + Math.round(blob.size/1024) + " KiB PCM audio. "
      + ($("persona").value === "neutral" ? "Synthetic voice." : "Fictional dramatization."));
  } catch (e) { setStatus("Error: " + e.message); }
  finally { button.disabled = false; }
});
$("archive").addEventListener("change", (event) => {
  const file = event.target.files && event.target.files[0];
  if (currentArchiveURL) URL.revokeObjectURL(currentArchiveURL);
  if (!file) { $("archival-player").removeAttribute("src"); return; }
  if (!file.type.startsWith("audio/")) {
    setStatus("Please select an audio recording."); return;
  }
  currentArchiveURL = URL.createObjectURL(file);
  $("archival-player").src = currentArchiveURL;
});

async function renderEarGates(blob) {
  const bytes = await blob.arrayBuffer(), dv = new DataView(bytes);
  if (dv.byteLength < 44 || dv.getUint32(0,true) !== 0x46464952) throw new Error("Not a RIFF WAV");
  let offset=12, rate=0, bits=0, channels=0, pcm=[];
  while (offset + 8 <= dv.byteLength) {
    const kind=String.fromCharCode(...new Uint8Array(bytes,offset,4));
    const size=dv.getUint32(offset+4,true), at=offset+8;
    if (at+size > dv.byteLength) break;
    if(kind==="fmt " && size>=16) { channels=dv.getUint16(at+2,true);rate=dv.getUint32(at+4,true);bits=dv.getUint16(at+14,true); }
    if(kind==="data" && bits===16 && channels===1) {
      const count=Math.min(512,Math.floor(size/2));
      for(let i=0;i<count;i++) pcm.push(dv.getInt16(at+2*i,true)/32768);
      break;
    }
    offset=at+size+(size%2);
  }
  if (pcm.length<32 || !rate) throw new Error("Insufficient mono PCM for visual analysis");
  const n=2**Math.floor(Math.log2(pcm.length));
  const mean=pcm.slice(0,n).reduce((a,b)=>a+b,0)/n;
  const x=pcm.slice(0,n).map((v,i)=>(v-mean)*(0.5-0.5*Math.cos(2*Math.PI*i/(n-1))));
  const nyquist=rate/2;
  const edges=[0,70,140,240,400,600,900,1300,1850,2700,4000,6000,nyquist].map(z=>Math.min(nyquist,z));
  const energies=new Array(12).fill(0);
  for(let k=0;k<=n/2;k++){
    let re=0,im=0;
    for(let i=0;i<n;i++){const theta=2*Math.PI*k*i/n;re+=x[i]*Math.cos(theta);im-=x[i]*Math.sin(theta);}
    const f=k*rate/n, p=re*re+im*im;
    for(let b=0;b<12;b++) if((f>=edges[b]&&f<edges[b+1])||(k===n/2&&b===11)){energies[b]+=p;break;}
  }
  const total=energies.reduce((a,b)=>a+b,0)||1;
  const canvas=$("ear-gates"),ctx=canvas.getContext("2d"),w=canvas.width,h=canvas.height;
  ctx.clearRect(0,0,w,h);ctx.fillStyle="#0b212b";ctx.fillRect(0,0,w,h);
  const width=w/12;
  energies.forEach((v,i)=>{
    const share=v/total, bar=Math.max(2,Math.min(164,Math.sqrt(share)*165));
    ctx.fillStyle="#78dce8";ctx.fillRect(i*width+7,h-32-bar,width-14,bar);
    ctx.fillStyle="#a3cbd2";ctx.textAlign="center";ctx.font="12px system-ui";
    ctx.fillText(String(i+1),i*width+width/2,h-13);
  });
  $("ear-gates-label").textContent="12 non-overlapping spectrum gates · "+rate+" Hz PCM · first "+n+" samples analyzed locally";
}

window.addEventListener("beforeunload", () => {
  if (currentAudioURL) URL.revokeObjectURL(currentAudioURL);
  if (currentArchiveURL) URL.revokeObjectURL(currentArchiveURL);
});
$("voice").addEventListener("change", () => {
  const choice = $("voice").selectedOptions[0];
  if (choice && choice.dataset.lang) $("lang").value = choice.dataset.lang;
});
init();