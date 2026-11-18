const el = id => document.getElementById(id);
const storageKey = "tabor-field-game-v1";
let scenarios = [], run, board, locked = false, clock = null, graspedAt = null, threshold = 2000;

function recover() {
  try { return JSON.parse(localStorage.getItem(storageKey)); }
  catch { return null; }
}
function save() {
  try { localStorage.setItem(storageKey, JSON.stringify(run)); }
  catch { /* The active session remains playable. */ }
}
async function request(path, payload) {
  const result = await fetch("/api/field/" + path, payload === undefined ? {} : {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload),
  });
  const value = await result.json();
  if (!result.ok) throw new Error(value.error || "The field could not complete this turn.");
  return value;
}
function current() { return scenarios.find(item => item.id === run.scenario); }
function setText(id, value) { el(id).textContent = value; }
function items(id, lines) {
  el(id).replaceChildren(...lines.map(line => {
    const item = document.createElement("li");
    item.textContent = line;
    return item;
  }));
}
function card(actor, name, state) {
  const element = document.createElement("article");
  element.className = "card";
  const heading = document.createElement("h3");
  const main = document.createElement("strong");
  const details = document.createElement("p");
  heading.textContent = actor;
  main.textContent = name;
  details.textContent = state;
  element.append(heading,main,details);
  return element;
}
function button(title, command, fill = false) {
  const control = document.createElement("button");
  control.type = "button";
  control.textContent = title;
  control.disabled = locked;
  control.onclick = () => {
    if (fill) {
      el("command").value = command;
      el("command").focus();
    } else perform(command);
  };
  return control;
}
function shortcuts() {
  if (!board) return;
  const { state } = board;
  const scenario = current();
  const quick = [];
  if (state.barrier !== "cleared") {
    if (state.grasped) quick.push(button("Claymore of Clarity", "think Claymore of Clarity"),
      button("Rapier of Precision", "think Rapier of Precision"));
    else if (state.form === "Unmanifested Hilt") quick.push(button("Grasp hilt", "grasp"));
    else quick.push(button("Strike barrier", "strike " + scenario.barrier));
  }
  if (state.shadow === "roaming") {
    if (!state.traps.some(trap => trap.status === "Armed")) quick.push(button("Arm web", "deploy " + scenario.plane));
    else quick.push(button("Capture shadow", "capture " + scenario.shadow));
  }
  if (state.shadow === "held") quick.push(button("Convert shadow", "convert " + scenario.shadow));
  if (state.ruin === "present") quick.push(button("Clear ruins", "command " + scenario.directive + " | " + scenario.ruin));
  if (state.wovenOrder.some(thread => !thread.used) && state.ruin === "cleared" && state.barrier === "cleared") {
    quick.push(button("Weave pillar", "weave " + scenario.sector));
  }
  if (scenario.dreamRequired) quick.push(button("Enter dream", "dream ", true));
  if (state.canRewind) quick.push(button("Rewind one turn", "rewind"));
  el("quick").replaceChildren(...quick);
}
function render() {
  const { state, balance, complete } = board;
  const scenario = current();
  el("scenario").value = run.scenario;
  setText("mission", scenario.description);
  const trap = state.traps.at(-1);
  const loomState = trap ? trap.status + " · " + trap.plane + " · " + trap.scope : "Web ready";
  const threads = state.wovenOrder.map(thread => thread.id + (thread.used ? " · woven" : " · ready"));
  const pillars = state.newWorldMatrix.map(pillar => pillar.id + " · Innocence is God");
  el("cards").replaceChildren(
    card("Light Slayer", state.form, scenario.barrier + " · " + state.barrier),
    card("Light Sleyer", scenario.shadow + " · " + state.shadow,
      [loomState, ...threads, ...(state.dreams.length ? ["Latest dream: " + state.dreams.at(-1)] : [])].join(" / ")),
    card("Dark Slayer", "Agent 01", scenario.ruin + " · " + state.ruin),
    card("Dark Sleyer", scenario.sector, pillars.join(" / ") || "Awaiting a converted thread"),
  );
  el("meter").value = balance;
  setText("balance", balance + " / 100" + (complete ? " · Scenario complete" : ""));
  items("checks", board.checks.map(row => (row.done ? "✓ " : "○ ") + row.label + (row.points ? " · " + row.points : "")));
  items("log", board.events.slice(-12).reverse());
  setText("digest", board.receipt);
  shortcuts();
}
function stopClock() {
  clearTimeout(clock);
  clock = null;
  graspedAt = null;
}
function startClock() {
  stopClock();
  graspedAt = performance.now();
  clock = setTimeout(() => {
    if (board?.state.grasped && !locked) perform("think", threshold + 1);
  }, threshold + 15);
}
function setLocked(waiting) {
  locked = waiting;
  for (const id of ["run", "start", "scenario"]) el(id).disabled = locked;
  shortcuts();
}
async function begin(candidate) {
  if (locked) return;
  stopClock();
  setLocked(true);
  try {
    board = await request("play", candidate);
    run = candidate;
    save();
    render();
    setText("event", board.state.grasped ? "Hilt grasped. Think of a form within two seconds." : "");
    if (board.state.grasped) startClock();
  } catch (error) { setText("event", error.message); }
  finally { setLocked(false); }
}
async function perform(command, timed) {
  if (!run || !board || locked || !command.trim()) return;
  const elapsed = timed ?? (graspedAt === null ? 0 : Math.min(60000, Math.floor(performance.now() - graspedAt)));
  const move = { command, elapsed };
  setLocked(true);
  try {
    board = await request("play", { ...run, move });
    if (board.accepted) {
      run.history.push(move);
      el("command").value = "";
      save();
    }
    render();
    setText("event", board.event);
    if (board.state.grasped && (command.trim().toLowerCase() === "grasp" || graspedAt === null)) startClock();
    else if (!board.state.grasped) stopClock();
  } catch (error) { setText("event", error.message); }
  finally {
    setLocked(false);
    if (board?.state.grasped && graspedAt !== null && performance.now() - graspedAt > threshold &&
        !/^think(?:\s|$)/i.test(command.trim())) perform("think", threshold + 1);
  }
}
function newRun() {
  begin({ scenario: el("scenario").value, seed: crypto.getRandomValues(new Uint32Array(1))[0], history: [] });
}
el("console").onsubmit = event => { event.preventDefault(); perform(el("command").value); };
el("start").onclick = newRun;
el("scenario").onchange = newRun;
try {
  const configuration = await request("scenarios");
  scenarios = configuration.scenarios;
  threshold = configuration.hesitationThreshold;
  el("scenario").replaceChildren(...scenarios.map(scenario => new Option(scenario.name, scenario.id)));
  items("guide", configuration.controls.map(([command, description]) => command + " · " + description));
  const saved = recover();
  if (saved && scenarios.some(scenario => scenario.id === saved.scenario)) await begin(saved);
  if (!board) newRun();
} catch (error) { setText("event", error.message); }
