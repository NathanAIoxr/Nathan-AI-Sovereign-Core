import {connections,roles,release} from './home-core.mjs';

export const home = `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="Nathan AI 🚀 by Nathan Tabor. Play the Labs, inspect a result, and see the systems behind it.">
<meta name="color-scheme" content="dark"><title>Nathan AI 🚀 · Home</title>
<link rel="stylesheet" href="/home.css"><script type="module" src="/home.js"></script></head><body>
<header><div class="shell top"><a class="wordmark" href="/">Nathan AI 🚀</a><nav aria-label="Main navigation">
<a href="/play/mind">Play</a><a href="/workbench">Workbench</a><a href="#workers">Workers</a><a href="#owner">Owner</a>
</nav></div></header>
<main class="shell">
<section class="opening"><div><p class="byline">Nathan Tabor Labs</p><h1>The mind.<br>The brain.<br>The skull.</h1>
<p class="intro">“it’s just how I am or how I ain’t. Haha”</p>
<div class="actions"><a class="button primary" href="/play/mind">Play Track Baller</a><a class="button" href="/play/labs">Play the Labs</a></div>
</div><aside class="anchors" aria-label="Arithmetic anchors">
<div><b>1+1 = 2</b><span>BUILD</span></div><div><b>1-1 = 0</b><span>CLEAR</span></div>
<p>“Innocence never a commodity.”</p></aside></section>
<section aria-labelledby="play-heading"><h2 id="play-heading">Play the move. Open the record.</h2>
<div class="grid work"><article><h3>Track Baller · Mind of Nathan Tabor</h3><p>Swirl to charge. Flick to launch. Replay the catch, show the forces, or try the same release with different wind.</p><a href="/play/mind">Open Track Baller</a></article>
<article><h3>134 Labs challenges</h3><p>Start with the BUILD and CLEAR switches. Inspect the rule after the move, then replay it.</p><a href="/play/labs">Open Player Edition</a></article>
<article><h3>Quantum, chip and edge workbench</h3><p>Run the existing classical quantum, Boolean chip and edge compute experiments.</p><a href="/workbench">Open workbench</a></article>
<article><h3>Release the Hounds of Hell</h3><p>Play the arcade defense edition from Tabor Track Baller.</p><a href="/play/hounds">Open the arcade</a></article></div>
</section>
<section id="mind" aria-labelledby="mind-heading"><h2 id="mind-heading">How I am or how I ain’t</h2>
<blockquote>“my mind my soul, my spirit, my shadow, my essence, my core, my moral absolute my everything programed in binary code algorithms LLM’s the code of code with code, but no code 👩‍💻”</blockquote>
<dl class="distinctions">
<div><dt>Known / Unknown</dt><dd>The replay records the release and result. Why the player let go belongs to the player.</dd></div>
<div><dt>Seen / Unseen</dt><dd>See the shot. Turn on the field view to see the simulated wind and gravity.</dd></div>
<div><dt>Scene / Unscene</dt><dd>Keep the original shot. Revisit it from the other side, or change the wind in a separate simulation.</dd></div>
</dl></section>
<section id="workers" aria-labelledby="worker-heading"><div class="spread"><h2 id="worker-heading">Bees, ants and agents</h2><button type="button" id="refresh">Refresh status</button></div>
<p id="cycle" role="status">Checking the latest home receipt…</p><div class="grid" id="checks"></div>
<ul class="services">${connections.map(s=>`<li><a href="${s.url}/">${s.title}</a><span data-service="${s.id}">${s.protectedRoute?'Owner sign-in':'Awaiting receipt'}</span></li>`).join('')}</ul>
<details><summary>21 Hive role definitions</summary><ul class="roles">${roles.map(role=>`<li><strong>${role.name}</strong> · ${role.domain}</li>`).join('')}</ul></details>
<p class="small"><a href="/api/home/status">Home status receipt</a> · <a href="/api/receipts">Labs campaign receipts</a> · <a href="/api/home/check">Run local checks</a></p></section>
<section id="owner" aria-labelledby="owner-heading"><h2 id="owner-heading">Owner controls</h2><p>Open the existing signed-in console for private work, approvals and model jobs.</p>
<div class="actions"><a class="button" href="${connections[0].url}/">Absolute Intelligence</a><a class="button" href="${connections[3].url}/">ONE owner hub</a></div></section>
</main><footer class="shell footer">Nathan Tabor · <a href="https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/tree/main/app-factory/nathan-tabor-labs">Source on GitHub</a> · ${release}</footer></body></html>`;

export const styles = `*{box-sizing:border-box}html{color-scheme:dark;scroll-behavior:smooth}body{margin:0;background:#0a151d;color:#eef7f5;font:16px/1.55 Inter,Geist,system-ui,sans-serif}.shell{max-width:1150px;padding-inline:clamp(17px,5vw,48px);margin:auto}header{border-bottom:1px solid #35505b;background:#09131a}.top{display:flex;align-items:center;justify-content:space-between;gap:18px;min-height:64px;flex-wrap:wrap;padding-block:10px}.wordmark{font-weight:800;color:#e9fff6;text-decoration:none}nav{display:flex;gap:clamp(12px,3vw,32px);flex-wrap:wrap}a{color:#b8f8e2;text-underline-offset:4px}a:focus-visible,button:focus-visible,summary:focus-visible{outline:3px solid #ffe098;outline-offset:4px}nav a{font-weight:650;font-size:14px}.opening{border-bottom:1px solid #35505b;padding-block:clamp(34px,7vw,85px);display:grid;grid-template-columns:minmax(0,1fr) minmax(260px,.66fr);align-items:end;gap:36px}.byline{margin:0 0 12px;color:#9bdcc9;font-weight:700}.opening h1{margin:0;letter-spacing:-.069em;font-size:clamp(52px,8.5vw,104px);line-height:.94}.intro{margin:22px 0 0;font-size:clamp(17px,3vw,23px);color:#cee5df}.actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}.button,button{border:1px solid #5f7f89;color:#eafbfa;background:#13242f;border-radius:7px;font:inherit;font-weight:730;padding:9px 14px;min-height:44px}.button{text-decoration:none;display:inline-flex;align-items:center}.button.primary{background:#acf0d5;border-color:#acf0d5;color:#112e29}.anchors{border-left:1px solid #4f786f;padding:11px 0 11px 22px}.anchors div+div{margin-top:17px}.anchors b{display:block;font:780 clamp(28px,4vw,48px)/1.12 ui-monospace,monospace;color:#c1f5e1}.anchors span{color:#aacfce;font-size:13px}.anchors p{color:#eedaa5;margin:22px 0 0}section:not(.opening){margin-top:42px}h2{font-size:clamp(24px,4.2vw,39px);letter-spacing:-.043em;line-height:1.12;margin:0 0 15px}.grid,.distinctions{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,215px),1fr));gap:11px}.work{grid-template-columns:repeat(2,minmax(0,1fr))}article,.distinctions>div{background:#122631;border:1px solid #3d5e66;border-radius:9px;padding:15px}article h3{margin:0;font-size:17px}article p{margin:6px 0 10px;color:#c4d9d9;font-size:14px}article a{font-size:14px;font-weight:690}blockquote{background:#162d36;border-left:3px solid #a8eed5;margin:0;padding:17px 18px;font-size:clamp(16px,2vw,21px)}dt{font-weight:730}dd{margin:6px 0 0;color:#c4d8d5}.spread{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}.spread h2{margin:0}.spread button{font-size:14px}.services{padding:0;list-style:none}.services li{display:flex;justify-content:space-between;gap:12px;border-bottom:1px solid #3d5861;padding:9px 0}.services span,.small{font-size:14px;color:#c3d8d4}summary{cursor:pointer;font-weight:740;color:#d2f9eb}.roles{columns:2;padding-left:18px}.roles li{break-inside:avoid;margin-bottom:6px}.footer{margin-top:40px;border-top:1px solid #35505b;padding-block:18px;color:#bdd5d2;font-size:14px}button{cursor:pointer}@media(max-width:650px){.opening{grid-template-columns:1fr;gap:23px}.anchors{display:grid;grid-template-columns:1fr 1fr;gap:9px;border-left:0;border-top:1px solid #4f786f;padding:14px 0 0}.anchors div+div{margin:0}.anchors p{grid-column:1/-1;margin:4px 0 0}.work{grid-template-columns:1fr}.roles{columns:1}}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}`;

export const browser = `const status=document.getElementById('cycle'), checks=document.getElementById('checks');
const refresh=document.getElementById('refresh');
const make=(tag,value)=>{const n=document.createElement(tag);n.textContent=value;return n;};
const labels={'owner-sign-in':'Owner sign-in verified',online:'Online',unavailable:'Unavailable',unexpected:'Unexpected auth response'};
async function update(){
  refresh.disabled=true;
  try{
    const response=await fetch('/api/home/status',{cache:'no-store'});
    if(!response.ok)throw Error('Status currently unavailable');
    const data=await response.json(), latest=data.snapshots[0];
    checks.replaceChildren(...data.checks.checks.map(job=>{
      const card=make('article','');
      card.append(make('h3',job.name),make('p',job.result),make('strong',job.passed?'Pass':'Review'));
      return card;
    }));
    status.textContent=latest
      ? (data.fresh?'Latest scheduled check':'Last recorded check is older than expected')+' · '+new Date(latest.at).toLocaleString()+' · '+(latest.passed?'Passed':'Review needed')
      : 'Local runtime checks are available. The first scheduled receipt is pending.';
    for(const item of latest?.targets??[]){
      const tag=document.querySelector('[data-service="'+item.id+'"]');
      if(tag)tag.textContent=labels[item.state]??'Unknown';
    }
  }catch{
    status.textContent='Status unavailable. Play and the workbench still open from their links.';
  }finally{refresh.disabled=false;}
}
refresh.addEventListener('click',update);
update();`;
