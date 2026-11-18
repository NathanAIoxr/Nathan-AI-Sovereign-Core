const css=`
:root{color-scheme:dark;--bg:#0d1116;--panel:#152028;--line:#35505a;--text:#e9efeb;--muted:#afc3c5;--mint:#a4f4d5;--gold:#ffd797}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:16px/1.55 system-ui,sans-serif}main{width:min(1100px,100%);margin:auto;padding:clamp(14px,4vw,48px)}nav,.buttons{display:flex;gap:8px 15px;flex-wrap:wrap}nav{margin-bottom:25px}a{color:var(--mint);text-underline-offset:.2em}h1{font-size:clamp(2.5rem,8vw,6.13rem);letter-spacing:-.062em;line-height:.96;margin:10px 0 18px}h2,h3,p{margin:0 0 10px}header p,.muted{color:var(--muted)}section{margin-top:13px;background:var(--panel);border:1px solid var(--line);padding:clamp(13px,3vw,23px);min-width:0}.deck{display:grid;grid-template-columns:minmax(92px,155px) minmax(0,1fr);gap:20px;align-items:center}.dial{width:100%;aspect-ratio:1;border-radius:50%;border:1px solid var(--mint);display:grid;place-items:center;background:repeating-conic-gradient(#34575c 0deg 1deg,transparent 1deg 30deg);overflow:hidden}.rotor{width:71%;height:71%;border-radius:50%;border:3px solid #456467;background:#121b21;display:grid;place-items:center;position:relative;color:var(--gold);font:700 1.65rem ui-monospace,monospace;transition:transform .45s ease-in-out}.rotor:before{content:"";position:absolute;top:1px;width:4px;height:15%;background:var(--gold)}button,select{min-height:44px;max-width:100%;font:inherit;padding:6px 10px;border:1px solid #4f6e76;border-radius:4px;background:#10232a;color:var(--text)}button{color:var(--mint);font-weight:700;cursor:pointer}button.primary{background:var(--mint);color:#0d2420}button:disabled{opacity:.4;cursor:default}output{display:block;color:var(--gold);margin-top:10px}.counts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:13px 0}.counts div{border:1px solid var(--line);padding:7px;font-size:.82rem}.counts strong{display:block;color:var(--mint);font:650 clamp(1rem,3vw,1.7rem) ui-monospace,monospace}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,250px),1fr));gap:8px;margin:10px 0}.card{background:#0f1a21;border:1px solid var(--line);padding:10px;overflow-wrap:anywhere}.card p{font-size:.82rem;margin:3px 0;color:var(--muted)}ul{padding:0;list-style:none}li{margin:5px 0}small,code{overflow-wrap:anywhere}[hidden]{display:none!important}:focus-visible{outline:2px solid var(--gold);outline-offset:3px}@media(prefers-reduced-motion:reduce){.rotor{transition:none}}@media(max-width:540px){.deck{grid-template-columns:76px minmax(0,1fr);gap:12px}}
`;
export const page=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Tabor Family Federation</title><style>${css}</style><main>
<header><nav aria-label="Federation exports"><a href="/api/status">Roster counts</a><a href="/api/snapshot.json">JSON snapshot</a><a href="/api/federation.bin">Binary packet</a><a href="/api/audit">Audit</a></nav>
<h1>Tabor Family Federation</h1><p>GitHub workflows and Cloudflare bots and agents meet in one registry.</p></header>
<section><h2>One into Zero</h2><div class="deck"><div class="dial" aria-hidden="true"><div class="rotor" id="rotor"><span id="digit">0</span></div></div>
<div><p>Insert One into Zero. Turn right two full circles, then left four full circles.</p>
<div class="buttons"><button id="insert" class="primary">Insert One</button><button id="right" disabled>Right 360°</button><button id="left" disabled>Left 360°</button><button id="reset">Reset</button></div>
<output id="lock-status" aria-live="polite">Zero is waiting for One.</output></div></div></section>
<section id="registry" hidden aria-labelledby="registry-title"><h2 id="registry-title" tabindex="-1">Cross-connected directory</h2>
<div class="counts"><div>GitHub records<strong id="github">—</strong></div><div>Cloudflare records<strong id="cloudflare">—</strong></div><div>Assignments<strong id="assignments">—</strong></div></div>
<p class="muted" id="counts"></p><p class="muted">Each record gets Build, Verify, and Relay assignments tied to a counterpart in the other family.</p>
<div class="buttons"><label>Family <select id="family"><option value="">Both</option><option value="github">GitHub</option><option value="cloudflare">Cloudflare</option></select></label></div>
<div id="cards" class="cards"></div><div class="buttons"><button id="prev">Previous</button><button id="next">Next</button><output id="position"></output></div>
<h3>Connected services</h3><ul id="links"></ul></section>
<script type="module" src="/app.js"></script></main></html>`;

export const script=`
import {lockState} from "/protocol.mjs";
const el=id=>document.getElementById(id);
const fmt=new Intl.NumberFormat();
let moves=[],offset=0,loaded=false,turnTimer=null,query=0,state=lockState(moves),turning=false;
const limit=18;

async function get(url) {
  const response=await fetch(url);
  const data=await response.json();
  if(!response.ok)throw Error(data.error||"Request failed.");
  return data;
}

function render() {
  el("rotor").style.transform="rotate("+state.rotation+"deg)";
  el("digit").textContent=state.inserted?"1":"0";
  el("insert").disabled=state.inserted||turning;
  el("left").disabled=!state.inserted||state.open||turning;
  el("right").disabled=!state.inserted||state.open||turning;
  el("registry").hidden=!state.open||turning;
}
const nextText = step=>step==="insert"?"Insert One.":step==="right"?"Turn right 360°.":"Turn left 360°.";
function step(action) {
  const previous=state;
  moves.push(action);
  state=lockState(moves);
  if(state.progress===0)moves=[];
  if(action!=="insert"&&state.progress>previous.progress)turning=true;
  render();
  const finish=()=>{
    turning=false;
    render();
    el("lock-status").textContent=state.open?"Open · "+state.progress+"/7":
      (state.progress===0&&previous.progress>0?"Sequence reset. ":"")+nextText(state.next)+" "+state.progress+"/7";
    if(state.open){
      el("registry-title").focus();
      if(!loaded)openDirectory();
    }
  };
  if(turning)turnTimer=setTimeout(finish,470);
  else finish();
}
for(const move of ["insert","right","left"])el(move).onclick=()=>step(move);
el("reset").onclick=()=>{
  clearTimeout(turnTimer);
  moves=[];turning=false;state=lockState(moves);
  render();el("lock-status").textContent="Zero is waiting for One.";
};

function line(text,tag,className){
  const node=document.createElement(tag);
  if(className)node.className=className;
  node.textContent=text;
  return node;
}
async function showRoster(){
  const serial=++query;
  try{
    const family=el("family").value;
    const params=new URLSearchParams({offset,limit});
    if(family)params.set("family",family);
    const data=await get("/api/roster?"+params);
    if(serial!==query)return;
    const grid=el("cards");grid.replaceChildren();
    for(const entry of data.entries){
      const card=document.createElement("article");
      card.className="card";
      const name=line(entry.name,entry.url?"a":"strong");
      if(entry.url)name.href=entry.url;
      card.append(name,line(entry.kind+" · "+entry.state,"p"));
      if(entry.counterpart)card.append(line("Counterpart · "+entry.counterpart.name,"p"));
      for(const assignment of entry.assignments)card.append(line(assignment.binary_role+" · "+assignment.role,"p"));
      grid.append(card);
    }
    el("prev").disabled=offset===0;
    el("next").disabled=offset+data.entries.length>=data.total;
    el("position").textContent=data.total?fmt.format(offset+1)+"–"+fmt.format(offset+data.entries.length)+" of "+fmt.format(data.total):"No records";
  }catch(error){if(serial===query)el("position").textContent=error.message;}
}
async function openDirectory(){
  try{
    const status=await get("/api/status");
    el("github").textContent=fmt.format(status.github);
    el("cloudflare").textContent=fmt.format(status.cloudflare);
    el("assignments").textContent=fmt.format(status.assignment_count);
    el("counts").textContent=fmt.format(status.workflows)+" workflows · "+fmt.format(status.worker_scripts)+" deployed Workers · "+
      fmt.format(status.fleet_agents)+" fleet agents · "+fmt.format(status.rotational_agents)+" rotational agents";
    loaded=true;
    await showRoster();
  }catch(error){el("counts").textContent=error.message;}
  try{
    const links=await get("/api/connections"),list=el("links");
    list.replaceChildren();
    for(const s of [{name:"GitHub Actions",url:links.github},...links.services]){
      const item=document.createElement("li"),a=line(s.name,"a");
      a.href=s.url;
      item.append(a,typeof s.reachable==="boolean"?(s.reachable?" · reachable":" · unavailable"):"");
      list.append(item);
    }
  }catch(error){el("links").textContent=error.message;}
}
el("prev").onclick=()=>{offset=Math.max(0,offset-limit);showRoster();};
el("next").onclick=()=>{offset+=limit;showRoster();};
el("family").onchange=()=>{offset=0;showRoster();};
render();
`;
