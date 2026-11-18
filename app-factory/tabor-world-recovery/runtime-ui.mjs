const el = id => document.getElementById(id);
const endpoint = "/api/runtime/";
const storage = "tabor-world-runtime-v1";
const fictional = new Set(["manifest", "weave", "dream", "timeline", "retire", "sanctuary"]);
function readLocal() {
  try { return JSON.parse(localStorage.getItem(storage)) || {}; }
  catch { return {}; }
}
const stored = readLocal();
let scene = stored.scene;
let receipts = Array.isArray(stored.receipts) ? stored.receipts.slice(0, 8) : [];
let profile = null, stepList = [], page = 0, rosterRequest = 0, profileRequest = 0, running = false, countdown = null;
const save = () => {
  try { localStorage.setItem(storage, JSON.stringify({ scene, receipts })); }
  catch { /* The current session still works. */ }
};
async function api(route, body) {
  const response = await fetch(endpoint + route, body === undefined ? {} :
    { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "The runtime could not complete this request");
  return result;
}
function menu(target, rows, selected) {
  target.replaceChildren(...rows.map(([value, name]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = name;
    return option;
  }));
  if (rows.some(([id]) => id === selected)) target.value = selected;
}
function sceneView() {
  const state = scene ?? { turn: 0, obstacle: "Snag", shadow: "roaming", threads: 0, sanctuary: false, dreams: [] };
  el("scene-view").textContent = "Turn " + state.turn + " · " + state.obstacle + " · Shadow " + state.shadow +
    " · " + state.threads + " threads · " + (state.sanctuary ? "Sanctuary woven" : "Sanctuary pending");
  if (state.dreams?.length) {
    const note = document.createElement("p");
    note.className = "small";
    note.textContent = "Latest dream: " + state.dreams.at(-1);
    el("scene-view").append(note);
  }
}
function showReceipts() {
  el("receipt-list").replaceChildren(...receipts.map(row => {
    const list = document.createElement("li"), code = document.createElement("code");
    code.textContent = row.id;
    list.append(row.name + " · " + row.description + " · ", code);
    return list;
  }));
}
function stopClock() {
  if (countdown !== null) clearInterval(countdown);
  countdown = null;
}
function actionView() {
  const action = el("action").value;
  el("compare-wrap").hidden = action !== "relate";
  el("expected-wrap").hidden = action !== "verify";
  el("blade-wrap").hidden = action !== "manifest";
  el("grasp").hidden = action !== "manifest";
  el("working-wrap").hidden = fictional.has(action) && action !== "dream";
  el("scene").hidden = profile?.id.startsWith("tabor:") !== true;
  sceneView();
}
function showSequence() {
  el("sequence-box").hidden = !stepList.length;
  el("sequence").textContent = stepList.length ? stepList.map(step => step.name + " · " + step.action).join(" → ") : "";
  el("run-sequence").disabled = stepList.length < 2;
  el("add-step").disabled = stepList.length >= 5;
}
async function selectProfile(id) {
  const current = ++profileRequest;
  stopClock();
  try {
    const found = await api("profile?id=" + encodeURIComponent(id));
    if (current !== profileRequest) return;
    profile = found;
    el("title").textContent = found.name;
    el("source").textContent = found.collection + " · Source row " + (found.source.row + 1);
    el("result").hidden = true;
    el("status").textContent = "";
    el("facet-panel").hidden = false;
    el("facets").replaceChildren(...Object.entries(found.facets).map(([title, fields]) => {
      const card = document.createElement("div");
      const heading = document.createElement("h3");
      const value = document.createElement("code");
      card.className = "facet";
      heading.textContent = title.charAt(0).toUpperCase() + title.slice(1);
      value.textContent = fields.length ? fields.map(field => field.field + " · " + (typeof field.value === "string" ? field.value : JSON.stringify(field.value))).join("\n") : "No exact field in this source.";
      card.append(heading, value);
      return card;
    }));
    el("source-link").href = found.source.url ?? "https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/pull/311";
    el("actions").hidden = false;
    menu(el("action"), found.capabilities.map(item => [item.id, item.label]));
    showSequence();
    actionView();
    el("roster").querySelectorAll("button").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.profile === id)));
  } catch (error) {
    if (current === profileRequest) el("status").textContent = error.message;
  }
}
async function roster(chooseFirst = false) {
  const current = ++rosterRequest;
  try {
    const params = new URLSearchParams({ group: el("group").value, page, q: el("query").value });
    const result = await api("roster?" + params);
    if (current !== rosterRequest) return;
    el("roster-status").textContent = result.count.toLocaleString() + " profiles · Page " + (page + 1);
    el("previous").disabled = page === 0;
    el("next").disabled = (page + 1) * 80 >= result.count;
    el("roster").replaceChildren(...result.profiles.map(item => {
      const button = document.createElement("button");
      button.textContent = item.name;
      button.dataset.profile = item.id;
      button.setAttribute("aria-pressed", String(profile?.id === item.id));
      button.addEventListener("click", () => selectProfile(item.id));
      return button;
    }));
    if (chooseFirst && result.profiles[0]) await selectProfile(result.profiles[0].id);
  } catch (error) {
    if (current === rosterRequest) el("roster-status").textContent = error.message;
  }
}
async function perform({ steps, choice } = {}) {
  if (!profile || running) return;
  stopClock();
  const selected = profile.id;
  running = true;
  el("run").disabled = true;
  el("status").textContent = "Running on Cloudflare…";
  const payload = { id: selected, text: el("working").value, compare: el("compare").value,
    expected: el("expected").value, choice: choice ?? (el("blade").value || "automatic"), scene };
  try {
    const data = await api(steps ? "relay" : "run", steps ? { ...payload, steps } :
      { ...payload, action: el("action").value });
    if (data.result.scene) scene = data.result.scene;
    receipts = [{ name: data.profile.name, description: steps ? steps.map(step => step.action).join(" → ") : data.action, id: data.receipt.id },
      ...receipts].slice(0, 8);
    showReceipts();
    save();
    sceneView();
    if (profile.id === selected) {
      el("result").textContent = JSON.stringify(data, null, 2);
      el("result").hidden = false;
      el("status").textContent = data.result.event ?? "Run complete. Receipt saved.";
    }
  } catch (error) {
    if (profile.id === selected) el("status").textContent = error.message;
  } finally {
    running = false;
    el("run").disabled = false;
  }
}
el("group").addEventListener("change", () => { page = 0; el("query").value = ""; roster(true); });
let searchTimer;
el("query").addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { page = 0; roster(); }, 180);
});
el("previous").onclick = () => { if (page > 0) { page--; roster(); } };
el("next").onclick = () => { page++; roster(); };
el("action").onchange = () => { stopClock(); el("status").textContent = ""; actionView(); };
el("run").onclick = () => perform();
el("grasp").onclick = () => {
  if (running) return;
  stopClock();
  let seconds = 7;
  el("status").textContent = "Choose a form within " + seconds + " seconds, then run the action.";
  countdown = setInterval(() => {
    seconds--;
    if (seconds) el("status").textContent = el("blade").value ? "Form selected. Manifesting in " + seconds + " seconds." : "The blade chooses in " + seconds + " seconds.";
    else { stopClock(); perform({ choice: el("blade").value || "automatic" }); }
  }, 1000);
};
el("add-step").onclick = () => { if (profile && stepList.length < 5) stepList.push({ id: profile.id, name: profile.name, action: el("action").value }); showSequence(); };
el("run-sequence").onclick = () => { if (stepList.length >= 2) perform({ steps: [...stepList] }); };
el("clear-sequence").onclick = () => { stepList = []; showSequence(); };
el("reset-scene").onclick = () => {
  if (running) return;
  stopClock();
  scene = { turn: 0, obstacle: el("obstacle").value, shadow: "roaming", threads: 0, sanctuary: false, dreams: [], history: [] };
  save(); sceneView(); el("status").textContent = "New field scene opened.";
};
try {
  showReceipts();
  const { groups } = await api("groups");
  menu(el("group"), groups.map(group => [group.id, group.name]), "g0");
  await roster(true);
} catch (error) { el("roster-status").textContent = error.message; }
