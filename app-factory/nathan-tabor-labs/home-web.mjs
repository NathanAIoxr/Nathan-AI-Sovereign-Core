import { connections, roles, release } from './home-core.mjs';
import { directory, ownerLinks } from './home-directory.mjs';

const link = (title, href, primary = false) => `<a class="button${primary?' primary':''}" href="${href}">${title}</a>`;
const frame = (title, content, script = false) => `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark"><title>${title} · Nathan AI 🚀</title>
<link rel="stylesheet" href="/home.css?v=2">${script?'<script type="module" src="/home.js?v=2"></script>':''}</head>
<body><a class="skip" href="#main">Skip to content</a><header><div class="shell top">
<a class="wordmark" href="/">Nathan AI 🚀</a><nav aria-label="Main navigation">
<a href="/play/mind">Play</a><a href="/systems">Systems</a><a href="/workers">Workers</a><a href="/#owner">Owner</a>
</nav></div></header><main class="shell" id="main" tabindex="-1">${content}</main>
<footer class="shell footer">Nathan Tabor · <a href="https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/tree/main/app-factory/nathan-tabor-labs">GitHub source</a></footer></body></html>`;

export const home = frame('Home', `
<section class="opening"><div>
<p class="byline">Nathan Tabor Labs</p><h1>The mind. The brain. The skull.</h1>
<p class="intro">“it’s just how I am or how I ain’t. Haha”</p>
<div class="actions">${link('Play', '/play/mind', true)}${link('Open workbench', '/workbench')}${link('Browse all systems', '/systems')}</div>
</div><aside class="anchors" aria-label="Arithmetic anchors">
<div><b>1+1 = 2</b><span>BUILD</span></div><div><b>1-1 = 0</b><span>CLEAR</span></div>
<p>Innocence is never a commodity.</p></aside></section>
<div class="home-grid">
<section class="panel" aria-labelledby="mind-heading"><h2 id="mind-heading">The mind</h2>
<p>Make a move. Replay it. Change one input and see what follows.</p>
<p><a href="/play/labs">Play 134 Labs challenges</a></p>
<p><a href="/play/hounds">Release the Hounds of Hell · Protect Innocence</a></p>
<details id="mind"><summary>In Nathan Tabor’s words</summary>
<blockquote>“my mind my soul, my spirit, my shadow, my essence, my core, my moral absolute my everything programed in binary code algorithms LLM’s the code of code with code, but no code 👩‍💻”</blockquote>
<dl><dt>Known / Unknown</dt><dd>The replay records the release and result. The player can say why they let go.</dd>
<dt>Seen / Unseen</dt><dd>Watch the shot, then show the simulated wind and gravity.</dd>
<dt>Scene / Unscene</dt><dd>Replay the original or run the same release at a different wind setting.</dd></dl></details></section>
<section class="panel" id="workers" aria-labelledby="brain-heading"><h2 id="brain-heading">The brain</h2>
<p>Bees, Ant Farm, validators, and fleet supervisors.</p><p><a href="/workers">See what ran</a></p></section>
<section class="panel" id="owner" aria-labelledby="skull-heading"><h2 id="skull-heading">The skull</h2>
<p>Owner workspaces for approvals, model jobs, and original manuscripts.</p>
<ul class="plain">${ownerLinks.map(x=>`<li><a href="${x.href}">${x.title}</a></li>`).join('')}</ul></section>
</div>`);

export const systems = frame('Systems', `<section class="page-heading"><h1>Systems</h1></section>
<label for="system-search">Find a system</label>
<input id="system-search" type="search" placeholder="Search by name or purpose" autocomplete="off">
<p id="system-results" role="status"></p>
${directory.map(group=>`<section class="directory" data-group><h2>${group.heading}</h2><ul class="plain">
${group.entries.map(([title, href, description])=>`<li data-entry><a href="${href}">${title}</a><span>${description}</span></li>`).join('')}
</ul></section>`).join('')}`, true);

export const workers = frame('Workers', `<section class="page-heading"><div class="spread"><h1>Workers</h1>
<button type="button" id="refresh">Refresh</button></div><p id="cycle" role="status">Loading the latest receipt…</p></section>
<section class="panel" aria-labelledby="fleet-title"><h2 id="fleet-title">Fleet</h2>
<p id="fleet">Awaiting a fleet receipt.</p><p><a href="https://nathan-ai-fleet.nathantaboract.workers.dev/">Open fleet status</a></p></section>
<section class="directory" aria-labelledby="services-title"><h2 id="services-title">Connected services</h2>
<ul class="plain">${connections.map(service=>`<li><a href="${service.url}/">${service.title}</a><span data-service="${service.id}">Awaiting check</span></li>`).join('')}</ul></section>
<section class="directory" aria-labelledby="checks-title"><h2 id="checks-title">Home checks</h2><div class="home-grid" id="checks"></div></section>
<details class="panel"><summary>21 Hive role definitions</summary><ul class="roles">${roles.map(role=>`<li><strong>${role.name}</strong> · ${role.domain}</li>`).join('')}</ul></details>
<p class="small"><a href="/api/home/status">Machine-readable receipt</a> · <a href="/api/receipts">Labs campaign receipts</a> · ${release}</p>`, true);

export const styles = `*{box-sizing:border-box}[hidden]{display:none!important}html{color-scheme:dark}
body{margin:0;background:#0b161e;color:#edf8f4;font:16px/1.55 Inter,Geist,system-ui,sans-serif}
.shell{max-width:1100px;padding-inline:clamp(17px,5vw,44px);margin:auto}
header{border-bottom:1px solid #344d55}.top,.spread{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}.top{min-height:64px;padding-block:10px}.wordmark{font-weight:800;text-decoration:none;color:#eefcf6}nav{display:flex;gap:15px;flex-wrap:wrap}nav a{font-size:14px;font-weight:650}
a{color:#b6f5de;text-underline-offset:4px}:focus-visible{outline:3px solid #ffe098;outline-offset:4px}
.skip{position:absolute;left:8px;top:8px;transform:translateY(-160%);background:#0b161e;padding:9px}.skip:focus{transform:none}
.opening{padding-block:clamp(31px,7vw,72px);display:grid;grid-template-columns:minmax(0,1.7fr) minmax(220px,.8fr);gap:28px;align-items:end;border-bottom:1px solid #37505a}
h1{font-size:clamp(40px,7.5vw,91px);line-height:1.02;letter-spacing:-.066em;margin:0}h2{font-size:clamp(22px,4vw,30px);letter-spacing:-.025em;line-height:1.17;margin:0 0 10px}h3{font-size:17px;margin:0}
p{margin:7px 0 11px}.byline{color:#a2dccc;font-weight:690}.intro{color:#c5ded8;font-size:20px;margin-top:14px}
.actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:18px}.button,button{display:inline-flex;align-items:center;min-height:44px;padding:6px 13px;font:inherit;font-weight:650;border:1px solid #557780;border-radius:6px;color:#eafbf6;background:#142632;text-decoration:none}button{cursor:pointer}.primary{background:#b7efda;color:#153029;border-color:#b7efda}
.anchors{padding:12px 18px;border-left:1px solid #50736b}.anchors div+div{margin-top:11px}.anchors b{display:block;color:#c1f5e1;font:750 clamp(24px,4vw,40px)/1.2 ui-monospace,monospace}.anchors span{font-size:13px}.anchors p{color:#e9d7a6;font-size:14px;margin:12px 0 0}
.home-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,242px),1fr));gap:11px;margin-top:18px}
.panel{padding:14px 16px;background:#132631;border:1px solid #37545d;border-radius:8px}.panel p,.plain span,dd,.small,.footer{color:#c0d7d5}
summary{cursor:pointer;font-weight:650;color:#d4f9ee}blockquote{margin:11px 0;border-left:2px solid #a3e4cf;padding-left:11px}dt{font-weight:700}dd{margin:0 0 6px}
.plain{padding:0;list-style:none;margin:0}.plain li{padding:6px 0}.directory{margin:22px 0}.directory .plain li{border-bottom:1px solid #37505a;display:grid;grid-template-columns:minmax(170px,1fr) minmax(0,1.6fr);gap:11px}.plain span{font-size:14px}
.page-heading{margin:25px 0 16px}.page-heading h1{font-size:clamp(34px,6vw,59px)}label{display:block;font-weight:670;margin-bottom:4px}input{padding:9px 11px;font:inherit;color:#eff7f2;border:1px solid #587d87;background:#132631;border-radius:6px;min-height:44px;width:min(100%,440px)}
.roles{padding-left:18px;columns:2}.roles li{break-inside:avoid;margin-bottom:6px}.footer{border-top:1px solid #37505a;margin-top:31px;padding-block:13px;font-size:14px}
@media(max-width:640px){.opening{grid-template-columns:1fr;gap:16px}.anchors{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));border-left:0;border-top:1px solid #50736b;padding:12px 0 0}.anchors div+div{margin:0}.anchors p{grid-column:1/-1}.directory .plain li{grid-template-columns:1fr;gap:1px}.roles{columns:1}}`.replace('}.\nwordmark','}.wordmark');

export const browser = `const get = id => document.getElementById(id);
const text = (tag,value) => {const el=document.createElement(tag);el.textContent=value;return el;};
const search=get('system-search');
if(search){
  const groups=[...document.querySelectorAll('[data-group]')];
  search.addEventListener('input',()=>{
    const needles=search.value.toLowerCase().trim().split(/\\s+/).filter(Boolean);
    let count=0;
    for(const group of groups){
      const matches=[...group.querySelectorAll('[data-entry]')].filter(row=>{
        row.hidden=!needles.every(q=>row.textContent.toLowerCase().includes(q)); return !row.hidden;
      });
      count+=matches.length; group.hidden=!matches.length;
    }
    get('system-results').textContent=count===0?'No matching systems.':needles.length?count+' matches':'';
  });
}
const refresh=get('refresh');
if(refresh){
  const labels={'owner-sign-in':'Owner sign-in verified',online:'Online',unavailable:'Unavailable',unexpected:'Unexpected response'};
  async function update(){
    refresh.disabled=true;
    try{
      const response=await fetch('/api/home/status',{cache:'no-store'});
      if(!response.ok)throw Error('Status unavailable');
      const data=await response.json(), current=data.snapshots[0];
      get('checks').replaceChildren(...data.checks.checks.map(job=>{
        const card=text('article','');
        card.className='panel';
        card.append(text('h3',job.name),text('p',job.result),text('strong',job.passed?'Pass':'Review'));
        return card;
      }));
      get('cycle').textContent=current
        ? (data.fresh?'Latest receipt':'Last receipt · older than expected')+' · '+new Date(current.at).toLocaleString()+' · '+(current.passed?'Passed':'Review needed')
        : 'The first scheduled receipt is pending.';
      for(const item of current?.targets??[]){
        const tag=document.querySelector('[data-service="'+item.id+'"]');
        if(tag)tag.textContent=labels[item.state]??'Unknown';
      }
      const fleetSummary=get('fleet');
      if(fleetSummary){
        const fleet=current?.targets?.find(t=>t.id==='nathan-ai-fleet')?.fleet;
        fleetSummary.textContent=fleet ? fleet.managed+' managed workers · '+fleet.assigned+' supervisors assigned · '+
          fleet.checked+' checked · '+fleet.healthy+' healthy · '+fleet.protected+' protected · '+fleet.failed+' failed · '+fleet.pending+' pending'
          : 'Fleet counts are available in the fleet status.';
      }
    }catch{
      get('cycle').textContent='Receipt unavailable. Use the linked systems to check their status.';
    }finally{refresh.disabled=false;}
  }
  refresh.addEventListener('click',update);
  update();
}`;
