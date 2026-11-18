import {factory,factoryInfo} from "./factory.mjs";

export const screenStyle = String.raw`
:root{color-scheme:dark;--bg:#100f15;--panel:#191823;--line:#423d54;--fg:#f2eef7;--dim:#c6bed4;--accent:#ace7d1;--gold:#f9cf88}
*{box-sizing:border-box}
body{margin:0;background:radial-gradient(ellipse at 72% -12%,#37304c 0%,var(--bg) 62%) fixed;color:var(--fg);font:16px/1.55 system-ui,sans-serif}
main{width:min(1180px,100%);margin:auto;padding:clamp(16px,4vw,52px)}
main.narrow{width:min(760px,100%)}
header{margin:0 0 1.4rem;border-bottom:1px solid var(--line);padding:0 0 1.25rem}
nav{display:flex;flex-wrap:wrap;gap:.4rem 1.2rem;margin-bottom:1.75rem}
a{color:var(--accent);text-underline-offset:.22em}
a:hover{text-decoration-thickness:2px}
h1{font-size:clamp(2.55rem,7vw,5.25rem);letter-spacing:-.055em;line-height:1.02;margin:0 0 .8rem;text-wrap:balance}
h2,h3,p{margin:.15rem 0 .7rem}
h2{font-size:1.22rem}
h3{font-size:1.05rem}
.lead{max-width:58ch;color:var(--dim)}
.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem;margin-bottom:1rem}
.panel{min-width:0;background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:clamp(13px,3vw,25px)}
.panel.light{border-top:3px solid var(--gold)}
.panel.dark{border-top:3px solid #b8a2f2}
.controls{display:flex;flex-wrap:wrap;gap:.65rem;margin-top:.8rem}
.controls > label{min-width:min(100%,9rem)}
label{display:block;font-weight:650}
input,select,textarea,button{max-width:100%;min-height:46px;border-radius:6px;padding:.46rem .68rem;font:inherit}
input,select,textarea{display:block;margin:.3rem 0 .6rem;background:#101019;color:var(--fg);border:1px solid #666079}
textarea{width:100%;min-height:100px;resize:vertical}
input:not([type=number]),select{width:100%}
button{background:var(--gold);color:#231b13;border:1px solid var(--gold);font-weight:700;cursor:pointer}
button.secondary{color:var(--fg);background:#282439;border-color:#68607c}
button:disabled{opacity:.55;cursor:default}
:focus-visible{outline:3px solid var(--accent);outline-offset:3px}
dl{display:grid;grid-template-columns:max-content 1fr;gap:.36rem .7rem}
dt,.muted,small{color:var(--dim)}
dd{margin:0;overflow-wrap:anywhere}
output{display:block;color:var(--gold);min-height:1.5rem;margin-top:.5rem}
meter{width:min(14rem,75%);margin-right:.65rem}
pre{white-space:pre-wrap;overflow-wrap:anywhere;background:var(--bg);border:1px solid var(--line);padding:1rem}
ul{padding-inline-start:1.3rem}
li{padding:.3rem 0}
.projects{list-style:none;padding:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,15rem),1fr));gap:.75rem;margin:0 0 1.5rem}
.projects li{padding:.8rem;border:1px solid var(--line);border-radius:7px;background:var(--panel)}
.projects small{display:block;margin-top:.3rem}
#library-games{columns:2 15rem;list-style:none;padding:0}
#library-games li{break-inside:avoid;margin-right:.75rem;border-top:1px solid var(--line)}
[hidden]{display:none !important}
@media(max-width:650px){.grid{grid-template-columns:1fr}nav{margin-bottom:1.1rem}}
`;

const escaped = value => String(value).replace(/[&<>"']/g,
  c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);

function screen(title, description, content, script, narrow = false) {
  return "<!doctype html><html lang='en'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width, initial-scale=1'>"+
    "<meta name='theme-color' content='#100f15'><title>"+escaped(title)+" · Tabor World</title>"+
    "<link rel='manifest' href='/manifest.webmanifest'><link rel='apple-touch-icon' href='/icon-192.png'><link rel='icon' href='/icon-192.png'>"+
    "<link rel='stylesheet' href='/tabor.css'></head><body><main"+(narrow?" class='narrow'":"")+">"+
    "<header><nav aria-label='Tabor World'><a href='/'>Cannonball Stack</a><a href='/slayers-sleyers/'>Slayers &amp; Sleyers</a>"+
    "<a href='/factory/'>Factory</a></nav><h1>"+escaped(title)+"</h1><p class='lead'>"+escaped(description)+"</p></header>"+
    content+"</main><script type='module' src='"+script+"'></script><script defer src='/install.js'></script></body></html>";
}

export const gamePage = screen("Tabor Light Slayers & Sleyers",
  "Sever the barrier, convert the threat into a thread, clear the ruins, and weave an Innocence Pillar. Play all four roles to open each sector.",
  `<section class="grid" aria-label="Mission and sector state">
    <div class="panel"><h2>Campaign</h2><label for="sector">Sector</label><select id="sector"></select>
      <p id="task"></p><div class="controls"><button class="secondary" id="undo">Undo last move</button>
      <button class="secondary" id="reset">Restart sector</button><button id="next" hidden>Next sector</button></div>
      <small id="saving"></small></div>
    <div class="panel"><h2>Sector state</h2><dl>
      <dt>Barrier</dt><dd id="barrier"></dd><dt>Ruins</dt><dd id="decay"></dd>
      <dt>Threat</dt><dd id="threat"></dd><dt>Foundation</dt><dd id="weave"></dd></dl>
      <label for="stability">Stability</label><meter id="stability" min="0" max="12"></meter><span id="stability-text"></span>
    </div></section>
    <output id="feedback" role="status"></output>
    <section class="grid" aria-label="Four roles">
      <div class="panel light"><h2>Light Slayer</h2><p id="blade"></p><label for="desired">Thought-link blade form</label>
        <select id="desired"></select><label for="blade-name">Manifest name (optional)</label>
        <input maxlength="64" id="blade-name" placeholder="Claymore of Clarity"><div class="controls"><button id="grip">Grip the hilt</button>
        <button id="manifest" class="secondary">Manifest</button><button id="strike" class="secondary">Strike barrier</button></div></div>
      <div class="panel light"><h2>Light Sleyer</h2><p id="trap"></p>
        <label for="plane">Web plane</label><select id="plane"></select><label for="scope">Web scope</label><select id="scope"></select>
        <div class="controls"><button id="arm">Arm the web</button><button id="convert" class="secondary">Capture and convert</button></div></div>
      <div class="panel dark"><h2>Dark Slayer</h2><label for="directive">Command to clear the ruins</label><select id="directive"></select>
        <button id="clear">Execute directive</button></div>
      <div class="panel dark"><h2>Dark Sleyer</h2><p class="muted">Weave the converted thread into the space cleared by the Dark Slayer.</p>
        <button id="build">Weave foundation</button></div></section>
    <section class="grid" aria-label="Lock and journal">
      <div class="panel"><h2>One into Zero</h2><p>Turn right twice, then left four times to open the sector.</p>
        <p id="lock-count"></p><div class="controls"><button id="left" class="secondary">Full circle left</button><button id="right">Full circle right</button></div></div>
      <div class="panel"><h2>Move journal</h2><ol id="journal"></ol></div>
    </section>`, "/slayers-sleyers/app.js");

export const factoryPage = screen("Tabor 1-2-3 Factory",
  "Open a project workspace or launch a playable title from the Library of Tabor.",
  "<section><h2>Factory projects</h2><p class='muted'>"+factoryInfo.workspaces+" workspaces of "+factoryInfo.target+
  " planned projects. "+factoryInfo.awaitingSource+" entries are awaiting source.</p><ul class='projects'>"+
  factory.map(item=>"<li><a href='"+item.path+"'>"+escaped(item.title)+"</a><small>"+escaped(item.intro)+"</small></li>").join("")+
  "</ul></section><section class='panel'><h2>Library of Tabor games</h2><p><a href='"+factoryInfo.library+"'>Open the original Library</a></p>"+
  "<label for='library-filter'>Search playable titles and shelf codes</label><input id='library-filter' type='search' maxlength='120' disabled>"+
  "<p role='status' id='library-status'>Opening the Library index…</p><ul id='library-games'></ul></section>", "/factory/app.js");

function fieldMarkup(field, required) {
  const id = "field-"+field.id;
  const label = "<label for='"+id+"'>"+escaped(field.label)+"</label>";
  const hint = field.hint ? "<small id='"+id+"-hint'>"+escaped(field.hint)+"</small>" : "";
  const attrs = " id='"+id+"' name='"+field.id+"'"+(required?" required":"")+(hint?" aria-describedby='"+id+"-hint'":"");
  let control;
  if (field.type === "select") {
    control = "<select"+attrs+">"+field.options.map(option=>"<option>"+escaped(option)+"</option>").join("")+"</select>";
  } else if (field.type === "text") {
    control = "<textarea"+attrs+" maxlength='5000'></textarea>";
  } else if (field.type === "number") {
    control = "<input"+attrs+" type='number' inputmode='numeric' step='1' min='0' max='9999999' required>";
  } else if (field.type === "date") {
    control = "<input"+attrs+" type='date'>";
  } else {
    control = "<input"+attrs+" type='text' maxlength='220'>";
  }
  return "<div>"+label+hint+control+"</div>";
}

export function workspacePage(item) {
  return screen(item.title,item.intro,"<section class='panel'><form id='workspace' data-workspace='"+item.slug+"'>"+
    item.fields.map((field,index)=>fieldMarkup(field,index===0)).join("")+
    "<div class='controls'><button type='submit'>"+escaped(item.action)+"</button>"+
    "<button type='button' id='workspace-download' class='secondary' disabled>Download</button>"+
    "<button type='reset' class='secondary'>Clear draft</button></div></form>"+
    "<output role='status' id='workspace-status'></output><pre id='workspace-result' hidden></pre></section>",
    "/factory/app.js",true);
}
