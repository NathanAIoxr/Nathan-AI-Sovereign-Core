export const gameClient = String.raw`
import {scenarios, forms, planes, scopes, directives, discernAfterMs, lockPath, replay, play} from "/slayers-sleyers/engine.js";

const el = id => document.getElementById(id);
const storageKey = "taborslayers-campaign-v1";
const emptyCampaign = () => ({active:scenarios[0].id, runs:{}});
function load() {
  try {
    const data = JSON.parse(localStorage.getItem(storageKey));
    if (!data || !scenarios.some(s => s.id === data.active) || !data.runs || typeof data.runs !== "object") {
      return emptyCampaign();
    }
    const runs = Object.fromEntries(scenarios.map(s => {
      const raw = data.runs[s.id];
      const log = Array.isArray(raw) && raw.length <= 256 ? raw : [];
      return [s.id, log.slice(0,replay(s.id,log).journal.length)];
    }));
    return {active:data.active,runs};
  } catch {
    return emptyCampaign();
  }
}

let campaign = load();
let gripTimer;
let gripping = false;
const commands = () => campaign.runs[campaign.active] || [];
const current = () => replay(campaign.active,commands());

function save() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(campaign));
    el("saving").textContent = "";
  } catch {
    el("saving").textContent = "Browser storage is unavailable. Progress lasts in this tab.";
  }
}
function message(text) {
  el("feedback").textContent = text;
}
function setOptions(id, items) {
  el(id).replaceChildren(...items.map(([value,label]) => new Option(label,value)));
}
function render() {
  const state = current();
  const {scene, form, bladeName, trap, barrier, decay, converted, thread, foundation, stability, lock, complete, journal} = state;
  const attempts = commands();
  el("sector").value = scene.id;
  el("task").textContent = scene.task;
  el("barrier").textContent = scene.barrier + " · " + barrier + "/" + scene.guard;
  el("decay").textContent = scene.decay + " · " + decay + "/" + scene.decayEnergy + " · " + scene.directive;
  el("threat").textContent = scene.threat + " · " + scene.plane + " / " + scene.field;
  el("weave").textContent = foundation || thread || "Awaiting the converted thread and cleared ruins";
  el("blade").textContent = bladeName || "Unmanifested Hilt";
  el("trap").textContent = trap ? trap.plane + " · " + trap.scope : (converted ? "Threat converted" : "Web unarmed");
  el("stability").value = stability;
  el("stability-text").textContent = stability + "/12";
  el("lock-count").textContent = complete ? "Sector open" : lock + "/" + lockPath.length;
  el("undo").disabled = attempts.length === 0;
  el("reset").disabled = attempts.length === 0 && !gripping;
  el("grip").disabled = gripping || barrier === 0;
  el("manifest").disabled = !gripping;
  el("strike").disabled = form === null || barrier === 0;
  el("arm").disabled = converted;
  el("convert").disabled = !trap || barrier > 0 || converted;
  el("clear").disabled = decay === 0;
  el("build").disabled = Boolean(foundation) || !thread || decay > 0;
  el("left").disabled = !foundation || complete;
  el("right").disabled = !foundation || complete;
  const next = scenarios[scenarios.findIndex(s=>s.id===scene.id)+1];
  el("next").hidden = !complete || !next;
  el("next").dataset.sector = next?.id || "";
  el("journal").replaceChildren(...journal.slice(-12).reverse().map(event => {
    const li = document.createElement("li");
    li.textContent = event.role + " · " + event.note;
    return li;
  }));
}
function stopGrip() {
  clearTimeout(gripTimer);
  gripping = false;
}
function use(command) {
  if (commands().length >= 256) {
    message("Turn limit reached. Undo or restart the sector.");
    return;
  }
  const result = play(current(),command);
  if (result.ok) {
    campaign.runs[campaign.active] = [...commands(),command];
    save();
  }
  message(result.ok ? result.state.journal.at(-1).note : result.reason);
  render();
}
function switchSector(id) {
  if (!scenarios.some(s=>s.id===id)) return;
  stopGrip();
  campaign.active = id;
  save();
  render();
  message("Sector loaded.");
}
setOptions("sector",scenarios.map(s=>[s.id,s.name]));
setOptions("desired",forms.map((f,i)=>[i,f.name+" · Force "+f.force+" · Guard "+f.guard]));
setOptions("plane",planes.map(p=>[p,p]));
setOptions("scope",scopes.map(s=>[s,s]));
setOptions("directive",directives.map(d=>[d,d]));
el("sector").addEventListener("change",()=>switchSector(el("sector").value));
el("next").addEventListener("click",()=>switchSector(el("next").dataset.sector));
el("grip").addEventListener("click",()=>{
  gripping = true;
  message("Choose a blade form and press Manifest within two seconds.");
  render();
  gripTimer = setTimeout(()=>{
    const state = current();
    const choice = state.barrier <= 2 ? 0 : state.stability <= 3 ? 2 : 1;
    const form = state.form === choice ? (choice+1)%forms.length : choice;
    stopGrip();
    use({action:"manifest",form,auto:true});
  },discernAfterMs);
});
el("manifest").addEventListener("click",()=>{
  if (!gripping) return;
  stopGrip();
  use({action:"manifest",form:Number(el("desired").value),label:el("blade-name").value});
});
el("strike").addEventListener("click",()=>{stopGrip();use({action:"strike"});});
el("arm").addEventListener("click",()=>use({action:"arm",plane:el("plane").value,scope:el("scope").value}));
el("convert").addEventListener("click",()=>use({action:"convert"}));
el("clear").addEventListener("click",()=>use({action:"clear",directive:el("directive").value}));
el("build").addEventListener("click",()=>use({action:"weave"}));
el("left").addEventListener("click",()=>use({action:"rotate",direction:"left"}));
el("right").addEventListener("click",()=>use({action:"rotate",direction:"right"}));
el("undo").addEventListener("click",()=>{
  stopGrip();
  campaign.runs[campaign.active] = commands().slice(0,-1);
  save(); render(); message("Previous state restored.");
});
el("reset").addEventListener("click",()=>{
  stopGrip(); campaign.runs[campaign.active] = [];
  save(); render(); message("Sector restarted.");
});
render();
`;
