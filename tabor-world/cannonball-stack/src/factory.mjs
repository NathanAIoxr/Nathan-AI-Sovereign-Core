import catalog from "./catalog.json" with {type:"json"};

const line = (id, label, hint = "") => ({id,label,hint,type:"line"});
const text = (id, label, hint = "") => ({id,label,hint,type:"text"});
const date = (id, label) => ({id,label,type:"date"});
const select = (id, label, options) => ({id,label,type:"select",options});
const number = (id, label) => ({id,label,type:"number"});

const workspaces = {
  "one-the-last-app": {
    intro:"Bring one goal through Build, Clear, Integrate, and Verify.",
    action:"Make a one-page action plan",
    fields:[line("goal","What are you building?"),text("build","Build · 1 + 1 = 2"),text("clear","Clear · 1 − 1 = 0"),
      text("integrate","Integrate · 1 × 1 = 1"),text("verify","Verify · 1 ÷ 1 = 1")]
  },
  "make-ai-yours": {
    intro:"Create an editable, single-page site from a title, introduction, and sections.",
    action:"Build the page",
    fields:[line("title","Page title"),text("description","Introduction"),text("sections","Sections","Write one heading and description per line, separated by |.")]
  },
  "icu-buddy": {
    intro:"Put a check-in into words and choose a next step you can return to later.",
    action:"Create check-in",
    fields:[select("feeling","How are you feeling?",["Steady","Energized","Tired","Overwhelmed","Unsure"]),
      text("noticed","What are you noticing?"),line("need","What would help right now?"),line("next","One next step")]
  },
  "mad-man-app": {
    intro:"Move from idea to experiment. Define the result you can observe.",
    action:"Create experiment",
    fields:[line("idea","Idea"),text("hypothesis","What do you expect?"),text("method","How will you test it?"),line("result","What will you measure?")]
  },
  "tabor-light-bible": {
    intro:"Create a study card with your reference, KJV excerpt, and notes.",
    action:"Create study card",
    fields:[line("reference","Book, chapter, and verse"),text("passage","KJV passage"),text("observation","What does the passage say?"),
      text("interpretation","Your interpretation"),text("sources","Sources or parallel passages")]
  },
  "mespark-matrix": {
    intro:"Capture a memory and place it on the Truth, Time, Travel, or Transfiguration shelf.",
    action:"Create memory card",
    fields:[line("title","Memory title"),date("date","Date"),select("shelf","4T shelf",["Truth","Time","Travel","Transfiguration"]),
      text("memory","Memory"),line("source","Source or related memory")]
  },
  "mammal-lineage": {
    intro:"Record one lineage relationship with its source and the strength of the evidence.",
    action:"Create lineage record",
    fields:[line("subject","Animal or taxon"),line("related","Related animal or taxon"),
      select("relation","Relationship",["Parent","Offspring","Sister taxon","Shared ancestor","Relationship to research"]),
      line("source","Source"),select("confidence","Evidence status",["Recorded","Tentative","Awaiting source"])]
  },
  "gathering-circle": {
    intro:"Prepare a gathering agenda with a purpose, date, and talking points.",
    action:"Create agenda",
    fields:[line("gathering","Gathering name"),date("date","Date"),line("purpose","Purpose"),text("items","Talking points","One topic per line."),
      line("followup","Follow-up")]
  },
  "universal-obd": {
    intro:"Log a scan code and observations from your reader.",
    action:"Record scan",
    fields:[line("vehicle","Vehicle label"),line("code","OBD-II code","For example P0300."),
      date("date","Date"),text("conditions","Freeze-frame conditions and observations"),line("source","Scanner or reference")]
  },
  "tabor-logistics": {
    intro:"Prepare a dispatch sheet with ordered stops and a handoff checklist.",
    action:"Create dispatch sheet",
    fields:[line("job","Dispatch ID"),date("date","Dispatch date"),line("origin","Origin"),text("stops","Stops","One stop per line in travel order."),
      text("handoff","Handoff checklist","One item per line.")]
  },
  "icarus-baseball": {
    intro:"Score a baseball line with hits, at-bats, and strikeouts.",
    action:"Calculate batting line",
    fields:[line("player","Player or team"),number("atbats","At-bats"),number("hits","Hits"),number("strikeouts","Strikeouts")]
  },
  "aters-universe": {
    intro:"Create a character card for the Maters, Taters, or another Aters family.",
    action:"Create character card",
    fields:[line("name","Character name"),line("family","Aters family"),text("traits","Traits"),line("role","Role in the story"),
      text("scene","First scene")]
  },
  "gang-builder": {
    intro:"Set up a project team with roles, a goal, and a first shared assignment.",
    action:"Create team charter",
    fields:[line("team","Team name"),line("goal","Goal"),text("roles","Roles","Write one role and responsibility per line, separated by |."),
      text("assignment","First assignment")]
  },
  "godtabor-portal": {
    intro:"Draft cards for the literal, figurative, and mythological paths.",
    action:"Create portal cards",
    fields:[line("title","Portal title"),text("literal","Literal"),text("figurative","Figurative"),text("mythological","Mythological")]
  }
};

export const factory = catalog.blueprint_apps.map(item => ({
  ...item,
  path:"/factory/"+item.slug+"/",
  ...workspaces[item.slug]
}));
const publicLibrary = "https://tabor-world.nathantaboract.workers.dev/library/";
const libraryWorker = "https://tabor-universal-library-engine.nathantaboract.workers.dev/library/";
const grapple = "https://grapple-it.nathantaboract.workers.dev/#atlas/";

export const factoryInfo = {
  target:catalog.factory_target,
  workspaces:factory.length,
  awaitingSource:catalog.factory_target-factory.length,
  library:publicLibrary,
  entries:factory.map(({id,slug,title,zone,path,blueprintRoute})=>({id,slug,title,zone,path,blueprintRoute}))
};

export async function libraryIndex(binding) {
  const response = await binding.fetch("https://library.internal/library/catalog.json",{signal:AbortSignal.timeout(4000)});
  if (!response.ok) throw Error("Library returned "+response.status);
  const body = await response.json();
  if (!Array.isArray(body.entries) || body.entries.length !== 101 ||
      new Set(body.entries.map(entry=>entry?.id)).size !== 101) {
    throw Error("Library catalog incomplete");
  }
  const entries = body.entries.map(entry => {
    if (!/^\d{3}$/.test(entry.id) || typeof entry.title !== "string" || typeof entry.lcc !== "string" ||
        entry.play !== grapple+entry.id) {
      throw Error("Library record invalid");
    }
    return {id:entry.id,title:entry.title,shelf:entry.lcc,play:entry.play};
  });
  return {source:libraryWorker+"catalog.json", release:body.release, total:entries.length, entries};
}

export const factoryClient = String.raw`
const form = document.querySelector("#workspace");
const library = document.querySelector("#library-games");
const anchor = (label,url) => {
  const item = document.createElement("a");
  item.href = url;
  item.textContent = label;
  return item;
};
if (library) openLibrary();
if (form) workspace();

async function openLibrary() {
  const status = document.querySelector("#library-status");
  const filter = document.querySelector("#library-filter");
  try {
    const response = await fetch("/api/factory/library");
    if (!response.ok) throw Error();
    const {entries,total} = await response.json();
    function draw() {
      const q = filter.value.trim().toLowerCase();
      const visible = entries.filter(e => (e.id+" "+e.title+" "+e.shelf).toLowerCase().includes(q));
      status.textContent = visible.length + " of " + total + " playable Library titles";
      library.replaceChildren(...visible.map(entry => {
        const li = document.createElement("li");
        li.append(anchor(entry.id+" · "+entry.title,entry.play));
        return li;
      }));
    }
    filter.addEventListener("input",draw);
    filter.disabled = false;
    draw();
  } catch {
    status.textContent = "The live index is unavailable. Open the original Library for its releases.";
  }
}

function workspace() {
  const status = document.querySelector("#workspace-status");
  const result = document.querySelector("#workspace-result");
  const heading = document.querySelector("h1").textContent;
  const key = "tabor-factory:v1:" + form.dataset.workspace;
  const slug = form.dataset.workspace;
  const fields = [...form.elements].filter(node => node.name);
  const values = () => Object.fromEntries(fields.map(field => [field.name,field.value.trim()]));
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    for (const field of fields) {
      if (typeof saved?.[field.name] === "string") field.value = saved[field.name];
    }
  } catch {}
  let artifact = null;
  form.addEventListener("input",() => {
    artifact = null;
    result.hidden = true;
    document.querySelector("#workspace-download").disabled = true;
    try {
      localStorage.setItem(key,JSON.stringify(values()));
      status.textContent = "Draft saved on this browser.";
    } catch {
      status.textContent = "Draft storage is unavailable. Download your work before closing.";
    }
  });
  form.addEventListener("submit",event=>{
    event.preventDefault();
    const data = values();
    if (data[fields[0].name] === "") {
      status.textContent = "Enter " + fields[0].labels[0].textContent.toLowerCase() + ".";
      fields[0].focus();
      return;
    }
    try {
      artifact = create(slug,data,fields,heading);
      result.hidden = false;
      result.textContent = artifact.preview;
      document.querySelector("#workspace-download").disabled = false;
      status.textContent = artifact.note || "Ready to download.";
    } catch (error) {
      artifact = null;
      document.querySelector("#workspace-download").disabled = true;
      result.hidden = true;
      status.textContent = error.message;
    }
  });
  document.querySelector("#workspace-download").addEventListener("click",()=>{
    if (!artifact) return;
    const href = URL.createObjectURL(new Blob([artifact.file],{type:artifact.type}));
    const link = anchor("Download",href);
    link.download = slug+artifact.extension;
    link.click();
    setTimeout(()=>URL.revokeObjectURL(href),1000);
  });
  form.addEventListener("reset",()=>{
    try { localStorage.removeItem(key); } catch {}
    artifact = null;
    result.hidden = true;
    document.querySelector("#workspace-download").disabled = true;
    status.textContent = "Draft cleared.";
  });
}

const escapeHtml = value => value.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const lines = input => input.split(/\n/).map(v=>v.trim()).filter(Boolean);
function create(slug,data,fields,heading) {
  let note = "";
  if (slug === "icarus-baseball") {
    const {atbats,hits,strikeouts} = data;
    if (![atbats,hits,strikeouts].every(value=>/^\d{1,7}$/.test(value))) {
      throw Error("Enter nonnegative whole-number counts for at-bats, hits, and strikeouts.");
    }
    if (Number(hits)+Number(strikeouts)>Number(atbats)) throw Error("Hits plus strikeouts cannot exceed at-bats.");
    data.average = Number(atbats) ? (Number(hits)/Number(atbats)).toFixed(3).replace(/^0\./,".") : "—";
    data.strikeoutShareOfAtBats = Number(atbats) ? (100*Number(strikeouts)/Number(atbats)).toFixed(1)+"%" : "—";
    note = "Batting average " + data.average + " · Strikeouts per at-bat " + data.strikeoutShareOfAtBats;
  }
  if (slug === "universal-obd") {
    data.code = data.code.toUpperCase();
    if (!/^[PCBU][0-3][0-9A-F]{3}$/.test(data.code)) throw Error("Enter a five-character OBD-II code such as P0300.");
    note = "Scan code recorded.";
  }
  if (slug === "make-ai-yours") {
    const escTitle = escapeHtml(data.title);
    const sections = lines(data.sections).map(value=>{
      const split = value.indexOf("|");
      const title = split === -1 ? value : value.slice(0,split).trim();
      const body = split === -1 ? "" : value.slice(split+1).trim();
      return "<section><h2>"+escapeHtml(title)+"</h2><p>"+escapeHtml(body)+"</p></section>";
    });
    const file = '<!doctype html>\n<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+escTitle+'</title><style>body{font:17px/1.6 system-ui,sans-serif;max-width:46rem;margin:auto;padding:2rem}p{white-space:pre-wrap}</style><main><h1>'+escTitle+'</h1><p>'+escapeHtml(data.description)+'</p>'+sections.join("")+'</main></html>\n';
    return {file,type:"text/html; charset=utf-8",extension:".html",preview:file,note:"Your editable HTML page is ready to download."};
  }
  if (slug === "tabor-logistics") {
    data.stops = lines(data.stops).map((stop,index)=>({order:index+1,stop}));
    data.handoff = lines(data.handoff);
  }
  if (slug === "gang-builder") {
    data.roles = lines(data.roles).map(entry=>{
      const [role,...words] = entry.split("|");
      return {role:role.trim(),responsibility:words.join("|").trim()};
    });
  }
  if (slug === "gathering-circle") data.items = lines(data.items);
  const file = JSON.stringify({project:heading,...data},null,2)+"\n";
  const preview = fields.filter(f=>data[f.name] && (!Array.isArray(data[f.name]) || data[f.name].length))
    .map(f=>f.labels[0].textContent+"\n"+(Array.isArray(data[f.name])
      ? data[f.name].map(value=>typeof value==="string"?value:Object.values(value).filter(Boolean).join(" · ")).join("\n")
      : data[f.name])).join("\n\n") + (slug === "icarus-baseball" ? "\n\n"+note : "");
  return {file,type:"application/json; charset=utf-8",extension:".json",preview,note};
}
`;
