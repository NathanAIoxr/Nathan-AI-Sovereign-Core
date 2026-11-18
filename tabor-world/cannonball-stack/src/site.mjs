import {words} from "./words.mjs";

export const clientWords="export const words=("+words.toString()+");\n";
const style=`
:root{color-scheme:dark;--bg:#101319;--card:#1a222b;--line:#3a4657;--text:#edf0e8;--dim:#b3bdc4;--gold:#ffcd8e;--mint:#a2ebca}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:16px/1.55 system-ui,sans-serif}main{width:min(1180px,100%);margin:auto;padding:clamp(15px,4vw,48px)}header{border-bottom:1px solid var(--line);padding:12px 0 24px}nav,.controls{display:flex;flex-wrap:wrap;gap:9px 15px;margin:8px 0 16px}nav a,a{color:var(--mint);text-underline-offset:.2em}h1{font-size:clamp(2.8rem,8vw,6rem);letter-spacing:-.065em;margin:12px 0;line-height:.98}h2,h3,p{margin:0 0 11px}p.lead,.muted,small{color:var(--dim)}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:13px}section{min-width:0;padding:clamp(14px,3vw,24px);background:var(--card);border:1px solid var(--line)}.wide{margin-top:12px}textarea,input,button,select{background:#111b24;color:var(--text);border:1px solid #4a6671;border-radius:4px;min-height:43px;padding:6px 10px;font:inherit;max-width:100%}textarea{width:100%;min-height:95px;resize:vertical}button{background:var(--gold);color:#251b16;cursor:pointer;font-weight:700}button:disabled{opacity:.48}output{display:block;color:var(--gold);overflow-wrap:anywhere;margin:10px 0}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#111b24;padding:10px;font-size:.83rem}ul{list-style:none;padding:0}li{border-top:1px solid var(--line);padding:6px 0}.pulses{margin:4px 0 9px;font:600 1rem ui-monospace,monospace;color:var(--mint)}label{display:grid;gap:3px}input[type=number]{width:110px}footer{padding:16px 0}:focus-visible{outline:2px solid var(--gold);outline-offset:2px}@media(max-width:700px){.grid{grid-template-columns:1fr}}
`;
export const page=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>.:. My stack of cannon balls by Nathan Tabor</title><style>${style}</style>
<main><header><nav><a href="#rhythm">Rhythm Matrix</a><a href="#words">WORDS / Mirror</a><a href="#power">Power data</a><a href="/api/catalog">Catalog API</a></nav>
<h1>.:. My stack of cannon balls</h1><p class="lead">By Nathan Tabor</p><p>Will · Wheel · Way</p></header>
<div class="grid"><section id="rhythm"><h2>13 / 17 Magi Cicada Rhythm Matrix</h2>
<p class="pulses">10 · 8 · 6 · 5 · 4 · 10 · 9 · 2 = 54 pulses</p><form id="clock" class="controls">
<label>Whole-number tick<input id="tick" type="number" value="221" required><span></span></label><button>Read both cycles</button></form>
<output id="clocks" aria-live="polite"></output><p>Black notes · F♯ G♯ A♯ C♯ D♯</p>
<div class="controls"><label>Tempo<input id="tempo" type="number" min="45" max="150" value="84"></label><button id="play">Play score</button><button id="stop" disabled>Stop</button></div>
<p class="muted" id="audio-status" role="status"></p></section>
<section id="words"><h2>WORDS / Mirror</h2><p class="muted">Keep the original text, reverse it by character cluster, and derive its first letters, SHA-256 and logical addresses. The text stays in this tab.</p>
<form id="word-form"><textarea id="phrase" aria-label="Original text" maxlength="16000" required>Nathan AI Sovereign Core</textarea><button>Decode text</button></form><pre id="decoded" aria-live="polite" hidden></pre></section></div>
<div class="grid"><section><h2>Will · Wheel · Way</h2><ul id="ways"></ul><a href="/api/will-wheel-way">Read all directional links</a></section>
<section id="power"><h2>Power data</h2><p class="muted">Public Great Britain generation mix from the National Energy System Operator.</p><button id="read-power">Read generation mix</button><output id="power-time" aria-live="polite"></output><ul id="fuels"></ul></section></div>
<div class="grid"><section><h2>Sovereign Core catalog</h2><p class="muted" id="catalog-size">Reading the blueprint catalog…</p>
<label>View<select id="category"><option value="expansion_families">Expansion families</option><option value="council_archetypes">Council archetypes</option><option value="blueprint_apps">Factory app blueprint entries</option></select></label>
<ul id="catalog-list"></ul></section><section><h2>Connected builds</h2><ul id="links"></ul></section></div>
<footer><a href="/api/score">Score JSON</a> · <a href="https://api.carbonintensity.org.uk/">Power data documentation</a></footer>
</main><script type="module" src="/app.js"></script></html>`;

export const script=`
import {words} from "/words.js";
const el=id=>document.getElementById(id);
const list=(id,rows,label)=>{
  const root=el(id);root.replaceChildren();
  for(const item of rows){const row=document.createElement("li");row.textContent=label(item);root.append(row);}
};
async function get(path) {
  const r=await fetch("/api/"+path);
  const out=await r.json();
  if(!r.ok)throw Error(out.error||"Unavailable");
  return out;
}
async function clock(){
  try{
    const d=await get("rhythm?tick="+encodeURIComponent(el("tick").value));
    el("clocks").textContent="13-cycle "+d.cycle13+" · 17-cycle "+d.cycle17+" · "+(d.align?"Both cycles align":"Joint period "+d.joint_period);
  }catch(error){el("clocks").textContent=error.message;}
}
el("clock").onsubmit=event=>{event.preventDefault();clock();};
el("word-form").onsubmit=async event=>{
  event.preventDefault();
  try{
    const d=await words(el("phrase").value);el("decoded").hidden=false;el("decoded").textContent=JSON.stringify(d,null,2);
  }catch(error){el("decoded").hidden=false;el("decoded").textContent=error.message;}
};
el("read-power").onclick=async()=>{
  try{
    const d=await get("power");el("power-time").textContent=d.from+" to "+d.to;
    list("fuels",d.fuels,x=>x.fuel+" · "+x.percent+"%");
  }catch(error){el("power-time").textContent=error.message;}
};
let audio=null,timer=null,generation=0;
function stop(){
  generation++;
  clearTimeout(timer);
  if(audio){void audio.close();audio=null;}
  el("play").disabled=false;el("stop").disabled=true;el("audio-status").textContent="Score stopped.";
}
el("stop").onclick=stop;
el("play").onclick=async()=>{
  el("play").disabled=true;el("stop").disabled=false;
  const run=++generation;
  try {
    audio=new AudioContext();
    await audio.resume();
    const score=await get("score");
    if(run!==generation)return;
    const value=Number(el("tempo").value)||84,tick=60/Math.max(45,Math.min(value,150));
    const hz=[369.994,415.305,466.164,554.365,622.254];
    let when=audio.currentTime+.15;
    score.groups.forEach((count,group)=>{
      const pair=score.pairs[group%score.pairs.length];
      for(let i=0;i<count;i++){
        const oscillator=audio.createOscillator(),gain=audio.createGain();
        oscillator.frequency.value=hz[pair[i%2]];
        gain.gain.setValueAtTime(.001,when);
        gain.gain.exponentialRampToValueAtTime(.09,when+.01);
        gain.gain.exponentialRampToValueAtTime(.001,when+.18);
        oscillator.connect(gain).connect(audio.destination);
        oscillator.start(when);oscillator.stop(when+.20);when+=tick;
      }
    });
    el("audio-status").textContent="Playing all 54 pulses.";
    timer=setTimeout(()=>{stop();el("audio-status").textContent="Score complete.";},(when-audio.currentTime)*1000);
  }catch(error){stop();el("audio-status").textContent=error.message;}
};
async function initial(){
  clock();
  get("will-wheel-way").then(d=>list("ways",[...d.connections,...d.identities],pair=>pair.join(" = "))).catch(e=>list("ways",[e.message],x=>x));
  get("catalog").then(d=>{
    el("catalog-size").textContent="172 family addresses · 1,382 Clover addresses · 732m Supernodes · 126B Omni";
    const draw=()=>list("catalog-list",d[el("category").value],row=>(row.title||row.name||row.code)+" · "+row.zone);
    el("category").onchange=draw;draw();
  }).catch(e=>{el("catalog-size").textContent=e.message;});
  get("connections").then(d=>{
    const root=el("links");root.replaceChildren();
    for(const item of d.services){
      const li=document.createElement("li"),a=document.createElement("a");
      a.textContent=item.name;a.href=item.url;li.append(a,item.reachable?" · reachable":" · unavailable");root.append(li);
    }
  }).catch(e=>list("links",[e.message],x=>x));
}
initial();
`;
