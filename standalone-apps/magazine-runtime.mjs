const MAG_CSS = `:root{color-scheme:light;--display:"Baskervville",Georgia,serif;--body:"Instrument Sans",system-ui,sans-serif}
*,*::before,*::after{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.6 var(--body)}img{max-width:100%;height:auto;display:block}a{color:inherit;text-underline-offset:.24em}a:hover{text-decoration-thickness:.13em}a:focus-visible,button:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid var(--accent);outline-offset:4px}
.wrap{width:min(72rem,calc(100% - 2.4rem));margin-inline:auto}.mast{min-height:4.3rem;border-bottom:1px solid color-mix(in srgb,var(--ink) 22%,transparent);display:flex;align-items:center}.mast .wrap{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:.4rem 1.1rem;padding-block:.65rem}.wordmark{font:800 clamp(1.3rem,4vw,2rem)/1 var(--display);text-decoration:none;letter-spacing:-.055em;color:var(--accent)}.nav,.actions{display:flex;flex-wrap:wrap;align-items:center;gap:.65rem 1.1rem}.nav a{font-size:.89rem}.hero{background:var(--dark);color:#fff0d8}.hero .wrap{display:grid;grid-template-columns:1.3fr .78fr;align-items:center;gap:clamp(1.25rem,6vw,5rem);padding:clamp(1.6rem,5vw,4rem) 0}.hero p{max-width:29rem}.artwork{width:min(18rem,100%);display:block;justify-self:center;box-shadow:0 20px 48px #0008;border:1px solid #e6ba6c55;transform:rotate(2deg);margin:.4rem 0}.artwork:hover{transform:none}.artwork img{width:100%;aspect-ratio:2/3;object-fit:cover}.credit{color:var(--muted)}.hero .credit{color:#ead2ad}
h1,h2,h3{font-family:var(--display);line-height:1.04;letter-spacing:-.045em;font-weight:700}h1{margin:.3rem 0 .7rem;font-size:clamp(2.7rem,8.5vw,6.7rem);overflow-wrap:anywhere}h2{font-size:clamp(1.9rem,4vw,3.1rem);margin:.3rem 0 .7rem}h3{font-size:1.55rem;margin:.2rem 0 .65rem}.eyebrow{font-weight:750;font-size:.73rem;letter-spacing:.12em;text-transform:uppercase;color:var(--accent);margin:0 0 .3rem}.hero .eyebrow{color:var(--bright)}.button,button{display:inline-flex;align-items:center;justify-content:center;gap:.35rem;min-height:44px;padding:.62rem .94rem;border:1px solid var(--accent);border-radius:.14rem;background:var(--accent);color:var(--paper);font:700 .87rem/1.2 var(--body);text-decoration:none;cursor:pointer}button:disabled{cursor:default;opacity:.66}.hero .button{background:#f2d0a0;border-color:#f2d0a0;color:var(--dark)}.button.outline,button.outline{color:inherit;background:transparent;border-color:currentColor}.section{padding-block:clamp(2rem,5vw,4rem)}.section-head{display:flex;justify-content:space-between;align-items:end;gap:1rem;flex-wrap:wrap;margin-bottom:1rem}.filter{display:grid;gap:.24rem;min-width:min(17rem,100%);font-weight:650}.filter input{width:100%;color:inherit;background:transparent;border:1px solid var(--muted);font:inherit;padding:.5rem .65rem;min-height:44px}.shelf{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1.3rem}.card{border-top:1px solid color-mix(in srgb,var(--ink) 26%,transparent);padding-top:.7rem}.cover{display:block;background:var(--dark);aspect-ratio:2/3;overflow:hidden}.cover img{width:100%;height:100%;object-fit:cover}.card h3{margin:.6rem 0 .33rem}.card p{margin:.42rem 0;color:var(--muted)}.card .eyebrow{color:var(--accent)}.card a{text-decoration:none}.card a:hover{text-decoration:underline}.feature-game{padding:1.1rem 1.25rem;border:1px solid color-mix(in srgb,var(--ink) 25%,transparent);display:flex;gap:1rem;align-items:center;justify-content:space-between;flex-wrap:wrap;margin:1rem auto 3rem}.feature-game h2{font-size:1.75rem}.feature-game p{margin:.2rem 0}
.reader{display:grid;grid-template-columns:minmax(0,1fr) minmax(7rem,14rem);gap:clamp(1rem,4vw,3rem);align-items:start}.reader-cover{width:100%;border:1px solid color-mix(in srgb,var(--ink) 30%,transparent)}.reader h1,.play h1{font-size:clamp(2.5rem,7vw,5rem)}.piece{border-top:1px solid color-mix(in srgb,var(--ink) 24%,transparent);margin-top:1.8rem;padding-top:1.15rem}.piece h2{font-size:clamp(1.6rem,3.6vw,2.2rem)}.piece p,.piece li,.dek{max-width:67ch}.piece p{white-space:pre-wrap}.piece li{margin:.33rem 0}.sources{font-size:.88rem}.slogan{white-space:pre-wrap}.play{max-width:43rem}.play #board{min-height:10rem}.question{margin-top:1.4rem}.answers{display:grid;gap:.55rem}.answers button{justify-content:start;text-align:left}.game-caption{color:var(--muted);margin-bottom:.5rem}.status{min-height:1.55em;font-weight:650}.memory{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:.6rem}.memory button{position:relative;min-width:0;padding:.18rem;min-height:0;aspect-ratio:2/3;background:var(--dark);color:#f2d0a0;font:700 clamp(.8rem,3vw,1.55rem)/1 var(--display)}.memory img{width:100%;height:100%;object-fit:cover}.memory button[data-match=true]{opacity:.68}footer{border-top:1px solid color-mix(in srgb,var(--ink) 25%,transparent);padding:1.1rem 0 2.2rem;color:var(--muted)}footer a{margin-right:.6rem}[hidden]{display:none!important}
@media(max-width:650px){.wrap{width:calc(100% - 1.35rem)}.hero .wrap{grid-template-columns:1fr 37%;gap:.65rem}.hero h1{font-size:clamp(2.05rem,7.5vw,3.5rem)}.hero p{font-size:.92rem}.hero .actions{gap:.4rem}.hero .button{padding:.56rem .65rem}.artwork{transform:none}.shelf{grid-template-columns:repeat(2,minmax(0,1fr));gap:.8rem}.reader{grid-template-columns:1fr}.reader-cover{width:min(12rem,52%);grid-row:1}.memory{gap:.35rem}.filter{width:100%}.nav{gap:.62rem}}`;
const MAG_READER_JS = `const filter = document.querySelector("#issue-search");
if (filter) {
  const cards = [...document.querySelectorAll("[data-search]")];
  const status = document.querySelector("#issue-result");
  filter.addEventListener("input",() => {
    const words = filter.value.toLowerCase().trim().split(/\\s+/).filter(Boolean);
    let matches = 0;
    for (const card of cards) {
      card.hidden = !words.every(word => card.dataset.search.includes(word));
      if (!card.hidden) matches += 1;
    }
    status.textContent = matches === 1 ? "1 issue" : matches + " issues";
  });
}
const install = document.querySelector("#mag-install");
let appPrompt;
window.addEventListener("beforeinstallprompt",event => {
  event.preventDefault();
  appPrompt = event;
  if (install) install.hidden = false;
});
install?.addEventListener("click", async () => {
  if (!appPrompt) return;
  try { await appPrompt.prompt(); }
  finally { appPrompt = undefined; install.hidden = true; }
});
if ("serviceWorker" in navigator) navigator.serviceWorker.register("/magazine/sw.js").catch(() => {});
`;
const MAG_GAME_JS = `const root = document.querySelector("#board");
const status = document.querySelector("#game-status");
const score = document.querySelector("#game-score");
const reset = document.querySelector("#game-reset");
let attempt = 0;
const storageKey = SITE.id + ":magazine-game:v1";

function best(value, smaller = false) {
  try {
    const raw = localStorage.getItem(storageKey);
    const old = raw === null ? null : Number(raw);
    const next = old === null ? value : (smaller ? Math.min(old,value) : Math.max(old,value));
    localStorage.setItem(storageKey,String(next));
    return next;
  } catch { return value; }
}
function element(name,text,attributes={}) {
  const node = document.createElement(name);
  if (text !== null) node.textContent = text;
  for (const [key,value] of Object.entries(attributes)) node.setAttribute(key,value);
  return node;
}
function shuffle(values) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
function quiz() {
  const rounds = shuffle(SITE.game.rounds);
  let index = 0;
  let points = 0;
  status.textContent = "";
  function draw() {
    score.textContent = points + " / " + rounds.length + " correct";
    if (index === rounds.length) {
      const top = best(points);
      root.replaceChildren(element("h2","Round complete"),element("p","Your best score is " + top + " / " + rounds.length + "."));
      status.textContent = "Play again for a new order.";
      root.querySelector("h2").tabIndex = -1;
      root.querySelector("h2").focus();
      return;
    }
    const [question, choices, correct, reason] = rounds[index];
    const actions = element("div",null,{class:"answers"});
    const next = element("button","Next question",{type:"button",hidden:""});
    const heading = element("h2",question,{class:"question",tabindex:"-1"});
    const current = index;
    root.replaceChildren(element("p","Question " + (index + 1) + " of " + rounds.length,{class:"game-caption"}),heading,actions,next);
    for (const value of shuffle(choices.map((label,i) => ({label,i})))) {
      const answer = element("button",value.label,{type:"button",class:"outline"});
      answer.addEventListener("click",() => {
        const ok = value.i === correct;
        if (ok) points += 1;
        score.textContent = points + " / " + rounds.length + " correct";
        status.textContent = (ok ? "Correct. " : "Answer: " + choices[correct] + ". ") + reason;
        for (const button of actions.children) button.disabled = true;
        next.hidden = false;
        if (current === rounds.length - 1) next.textContent = "See score";
        next.focus();
      },{once:true});
      actions.append(answer);
    }
    next.addEventListener("click",() => { index += 1; status.textContent = ""; draw(); heading.blur(); root.querySelector("h2").focus(); },{once:true});
  }
  draw();
}
function memory() {
  const session = ++attempt;
  const cards = shuffle(SITE.cards.flatMap(card => [card,card]));
  const buttons = [];
  const grid = element("div",null,{class:"memory","aria-label":"Cover cards"});
  const matched = new Set();
  let first = null;
  let moves = 0;
  let locked = false;
  status.textContent = "Choose a card.";
  score.textContent = "0 pairs · 0 moves";
  function flip(i,open) {
    const button = buttons[i];
    if (!open) {
      button.replaceChildren(document.createTextNode("?"));
      button.setAttribute("aria-label","Card " + (i+1) + ", face down");
    } else {
      const card = cards[i];
      button.replaceChildren(element("img",null,{src:"/magazine/covers/" + card.cover + ".webp",alt:"",draggable:"false"}));
      button.setAttribute("aria-label","Card " + (i+1) + ", " + card.title);
    }
  }
  cards.forEach((card,i) => {
    const button = element("button","?",{type:"button","aria-label":"Card " + (i+1) + ", face down"});
    buttons.push(button);
    grid.append(button);
    button.addEventListener("click",() => {
      if (locked || first===i || matched.has(i)) return;
      flip(i,true);
      if (first === null) { first = i; status.textContent = card.title + ". Choose a second card."; return; }
      const previous = first;
      first = null;
      moves += 1;
      if (cards[previous].cover === card.cover) {
        matched.add(previous); matched.add(i);
        for (const position of [previous,i]) {
          buttons[position].disabled = true;
          buttons[position].dataset.match = "true";
        }
        if (matched.size === cards.length) {
          status.textContent = "All five pairs matched. Best: " + best(moves,true) + " moves.";
          reset.focus();
        } else {
          status.textContent = "Match: " + card.title + ".";
          buttons.find((node,index) => index > i && !node.disabled)?.focus();
          if (document.activeElement === document.body) buttons.find(node => !node.disabled)?.focus();
        }
      } else {
        locked = true;
        status.textContent = cards[previous].title + " and " + card.title + ". Try another pair.";
        setTimeout(() => {
          if (attempt !== session) return;
          flip(previous,false); flip(i,false); locked = false;
        },850);
      }
      score.textContent = matched.size / 2 + " pairs · " + moves + (moves===1 ? " move" : " moves");
    });
  });
  root.replaceChildren(grid);
}
const start = SITE.game.type === "memory" ? memory : quiz;
reset.addEventListener("click",() => { start(); root.querySelector("button")?.focus(); });
start();
`;

const MAG_SCOPE = "/magazine/";
const MAG_CSP = "default-src 'none'; style-src 'self'; script-src 'self'; img-src 'self'; connect-src 'self'; worker-src 'self'; manifest-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'";

function magEsc(value) {
  return String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
}

function magHref(site, path) {
  if (!site.staticHost) return path;
  if (path === MAG_SCOPE) return "/magazine/index.html";
  if (path === "/magazine/play" || path.startsWith("/magazine/issues/")) return path + ".html";
  return path;
}

function magImg(issue,{className="",loading="lazy"}={}) {
  return '<img class="'+className+'" src="/magazine/covers/'+issue.cover+'.webp" alt="'+magEsc(issue.alt)+'" width="768" height="1152" loading="'+loading+'" decoding="async">';
}

function magPage(site, title, content, { game=false }={}) {
  const archive = magHref(site,MAG_SCOPE);
  const play = magHref(site,"/magazine/play");
  const tools = site.existingApp ? '<a href="/app/">Open app</a>' : "";
  const legacy = site.existingApp ? '<a href="/project/">Project profile</a>' : "";
  const family = (site.family ?? []).map(([label,url])=>'<a href="'+magEsc(url)+'">'+magEsc(label)+'</a>').join("");
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
    '<meta name="theme-color" content="'+site.theme.dark+'"><meta name="description" content="'+magEsc(site.description)+'">'+
    '<title>'+magEsc(title)+' · '+magEsc(site.name)+'</title><link rel="stylesheet" href="/magazine/style.css"><link rel="manifest" href="/magazine/manifest.webmanifest">'+
    '<link rel="icon" href="/magazine/icon-192.png"><link rel="apple-touch-icon" href="/magazine/icon-192.png"><script src="/magazine/reader.js" type="module"></script>'+
    (game ? '<script src="/magazine/game.js" type="module"></script>' : '')+'</head><body>'+
    '<header class="mast"><div class="wrap"><a class="wordmark" href="'+archive+'">'+magEsc(site.name)+'</a><nav class="nav" aria-label="Magazine"><a href="'+archive+'">Issues</a><a href="'+play+'">Play</a>'+tools+'</nav></div></header>'+
    '<main>'+content+'</main><footer><div class="wrap"><p>Edited by '+magEsc(site.credits.join(" and "))+'</p>'+legacy+family+'</div></footer></body></html>';
}

function magIndex(site) {
  const [first] = site.issues;
  const issueUrl = issue => magHref(site,"/magazine/issues/"+issue.id);
  const play = magHref(site,"/magazine/play");
  const cards = site.issues.map(issue => {
    const words = [issue.title, issue.category, issue.number, issue.deck].join(" ").toLowerCase();
    return '<article class="card" data-search="'+magEsc(words)+'"><a class="cover" href="'+issueUrl(issue)+'">'+magImg(issue)+'</a>'+
      '<p class="eyebrow">'+magEsc(issue.number)+" · "+magEsc(issue.category)+'</p><h3><a href="'+issueUrl(issue)+'">'+magEsc(issue.title)+'</a></h3><p>'+magEsc(issue.deck)+'</p></article>';
  }).join("");
  const hero = '<section class="hero"><div class="wrap"><div><p class="eyebrow">Digital magazine</p><h1>'+magEsc(site.name)+'</h1>'+
    '<p>'+magEsc(site.description)+'</p>'+(site.slogan?'<p class="slogan">'+magEsc(site.slogan)+'</p>':'')+
    '<p class="credit">Edited by '+magEsc(site.credits.join(" and "))+'</p><div class="actions"><a class="button" href="'+issueUrl(first)+'">Read the first issue</a>'+
    '<a class="button outline" href="'+play+'">Play</a><button id="mag-install" class="outline" type="button" hidden>Install the magazine</button></div></div>'+
    '<a class="artwork" href="'+issueUrl(first)+'">'+magImg(first,{loading:"eager"})+'</a></div></section>';
  const collection = '<section class="section wrap" id="issues"><div class="section-head"><div><h2>Issues</h2><p id="issue-result" aria-live="polite">'+site.issues.length+' issues</p></div>'+
    '<label class="filter">Find an issue<input id="issue-search" type="search" placeholder="Search by title or subject"></label></div><div class="shelf">'+cards+'</div></section>';
  const activity = '<section class="feature-game wrap"><div><h2>'+magEsc(site.game.name)+'</h2><p>'+magEsc(site.game.label)+'</p></div><a class="button" href="'+play+'">Play '+magEsc(site.game.name)+'</a></section>';
  return magPage(site,"Magazine",hero+collection+activity);
}

function magIssue(site, issue) {
  const articles = issue.pieces.map(piece=> {
    const words = (piece.paragraphs ?? []).map(p=>'<p>'+magEsc(p)+'</p>').join('');
    const steps = piece.steps ? '<ol>'+piece.steps.map(step=>'<li>'+magEsc(step)+'</li>').join('')+'</ol>' : "";
    const refs = piece.sources ? '<ul class="sources">'+piece.sources.map(([label,url])=>'<li><a href="'+magEsc(url)+'">'+magEsc(label)+'</a></li>').join('')+'</ul>' : "";
    return '<section class="piece"><p class="eyebrow">'+magEsc(piece.kind)+'</p><h2>'+magEsc(piece.title)+'</h2>'+words+steps+refs+'</section>';
  }).join("");
  const archive = magHref(site,MAG_SCOPE);
  const next = site.issues[site.issues.indexOf(issue)+1];
  const nextLink = next?'<a class="button outline" href="'+magHref(site,"/magazine/issues/"+next.id)+'">Next issue</a>':'';
  const content = '<article class="section wrap reader"><div><p class="eyebrow">Issue '+magEsc(issue.number)+" · "+magEsc(issue.category)+'</p><h1>'+magEsc(issue.title)+'</h1>'+
    '<p class="dek">'+magEsc(issue.deck)+'</p>'+articles+'<div class="actions"><a href="'+archive+'">All issues</a>'+nextLink+'</div></div>'+
    magImg(issue,{className:"reader-cover",loading:"eager"})+'</article>';
  return magPage(site,issue.title,content);
}

function magPlay(site) {
  const content = '<section class="section wrap play"><h1>'+magEsc(site.game.name)+'</h1><p>'+magEsc(site.game.label)+'</p>'+
    '<p id="game-score" class="game-caption" aria-live="polite"></p><div id="board"></div><p id="game-status" class="status" role="status"></p>'+
    '<button id="game-reset" type="button" class="outline">Start over</button></section>';
  return magPage(site,site.game.name,content,{game:true});
}

function magCatalog(site) {
  return {name:site.name,version:site.version,editors:site.credits,game:{name:site.game.name,url:magHref(site,"/magazine/play")},
    issues:site.issues.map(issue=>({id:issue.id,title:issue.title,number:issue.number,category:issue.category,
      url:magHref(site,"/magazine/issues/"+issue.id),cover:"/magazine/covers/"+issue.cover+".webp"}))};
}

function magManifest(site) {
  return {id:MAG_SCOPE,name:site.name,short_name:site.name,description:site.description,start_url:magHref(site,MAG_SCOPE),scope:MAG_SCOPE,display:"standalone",
    background_color:site.theme.paper,theme_color:site.theme.dark,icons:[192,512].map(size=>({src:"/magazine/icon-"+size+".png",sizes:size+"x"+size,type:"image/png"}))};
}

function magServiceWorker(site) {
  const core = [magHref(site,MAG_SCOPE),magHref(site,"/magazine/play"),"/magazine/style.css","/magazine/reader.js","/magazine/game.js"];
  const optional = site.issues.flatMap(issue=>[magHref(site,"/magazine/issues/"+issue.id),"/magazine/covers/"+issue.cover+".webp"]);
  return "const PREFIX="+JSON.stringify(site.id+"-magazine-")+";\nconst NAME=PREFIX+"+JSON.stringify(site.version)+";\nconst CORE="+JSON.stringify(core)+";\nconst OPTIONAL="+JSON.stringify(optional)+";\n"+
    'self.addEventListener("install", event => event.waitUntil((async () => {const cache=await caches.open(NAME);await cache.addAll(CORE);await Promise.allSettled(OPTIONAL.map(path=>cache.add(path)));await self.skipWaiting();})()));\n'+
    'self.addEventListener("activate", event => event.waitUntil((async () => {for(const key of await caches.keys()){if(key.startsWith(PREFIX)&&key!==NAME)await caches.delete(key);}await self.clients.claim();})()));\n'+
    'self.addEventListener("fetch", event => { const url=new URL(event.request.url); if(event.request.method!=="GET"||url.origin!==self.location.origin||![...CORE,...OPTIONAL].includes(url.pathname))return; event.respondWith(fetch(event.request).catch(async()=>{const cache=await caches.open(NAME);return await cache.match(url.pathname)||Response.error();})); });';
}

function magReply(request, body, contentType, status=200) {
  const headers = {"content-type":contentType,"cache-control":"no-cache","x-content-type-options":"nosniff","referrer-policy":"same-origin"};
  if (contentType.startsWith("text/html")) headers["content-security-policy"] = MAG_CSP;
  return new Response(request.method==="HEAD"?null:body,{status,headers});
}

export async function magazineResponse(request,env,site) {
  const url = new URL(request.url);
  const path = url.pathname;
  const active = path === "/" || path === "/game" || path === "/game/" || path === "/api/magazine" || path === "/magazine" || path.startsWith(MAG_SCOPE);
  if (!active) return null;
  if (!["GET","HEAD"].includes(request.method)) return new Response(null,{status:405,headers:{allow:"GET, HEAD"}});
  const html = body => magReply(request,body,"text/html; charset=utf-8");
  const js = body => magReply(request,body,"text/javascript; charset=utf-8");
  const json = body => magReply(request,JSON.stringify(body),"application/json; charset=utf-8");
  if (path === "/" || path === MAG_SCOPE) return html(magIndex(site));
  if (path === "/magazine") return Response.redirect(new URL(MAG_SCOPE,url),308);
  if (path === "/game" || path === "/game/") return Response.redirect(new URL("/magazine/play",url),302);
  if (path === "/magazine/play") return html(magPlay(site));
  if (path === "/api/magazine") return json(magCatalog(site));
  if (path === "/magazine/manifest.webmanifest") return magReply(request,JSON.stringify(magManifest(site)),"application/manifest+json; charset=utf-8");
  if (path === "/magazine/reader.js") return js(MAG_READER_JS);
  if (path === "/magazine/game.js") {
    const payload = {id:site.id,game:site.game,cards:site.issues.map(({cover,title})=>({cover,title}))};
    return js("const SITE="+JSON.stringify(payload)+";\n"+MAG_GAME_JS);
  }
  if (path === "/magazine/sw.js") return js(magServiceWorker(site));
  if (path === "/magazine/style.css") {
    const variables = Object.entries(site.theme).map(([name,value])=>"--"+name+":"+value).join(";");
    return magReply(request,":root{"+variables+"}\n"+MAG_CSS,"text/css; charset=utf-8");
  }
  const icon = /^\/magazine\/icon-(192|512)\.png$/.exec(path)?.[1];
  if (icon) return magReply(request,Uint8Array.from(atob(site.icons[icon]),letter=>letter.charCodeAt(0)),"image/png");
  const slug = /^\/magazine\/issues\/([a-z0-9-]+)$/.exec(path)?.[1];
  const issue = slug && site.issues.find(record=>record.id===slug);
  if (issue) return html(magIssue(site,issue));
  const cover = /^\/magazine\/covers\/([a-z0-9-]+)\.webp$/.exec(path)?.[1];
  if (cover && site.issues.some(record=>record.cover===cover)) {
    const bucket = env[site.binding] ?? (site.fallbackBinding && env[site.fallbackBinding]);
    const call = request.method==="HEAD"?"head":"get";
    const object = await bucket?.[call]?.("magazine/covers/"+cover+".webp");
    if (object) {
      const headers = {"content-type":"image/webp","cache-control":"public, max-age=3600","x-content-type-options":"nosniff"};
      if (object.httpEtag) headers.etag = object.httpEtag;
      if (String(request.headers.get("if-none-match")).split(/,\s*/).includes(object.httpEtag)) {
        return new Response(null,{status:304,headers});
      }
      return new Response(request.method==="HEAD"?null:object.body,{headers});
    }
    if (typeof env.ASSETS?.fetch==="function") return env.ASSETS.fetch(request);
  }
  return magReply(request,"Not found","text/plain; charset=utf-8",404);
}
