import { createPattern, domainBees, orbit, patternPositions, previousBees, propose, resolve, stepPattern, trail } from "./hive-core.mjs";

const get = id => document.getElementById(id);
const named = (tag, text) => {
  const node = document.createElement(tag);
  node.textContent = text;
  return node;
};
const key = (row, column) => row + ":" + column;
const cells = new Map();
const orbitCells = new Set(orbit.map(([row, column]) => key(row, column)));
const trailValues = new Set(trail);
let state = createPattern();
let timer;
let task;

get("previous-bees").textContent = previousBees.map(bee => bee + " Bee").join(" · ");
for (const [domain, scope] of domainBees) {
  const option = named("option", domain);
  option.value = domain;
  get("domain").append(option);
  get("domain-bees").append(named("dt", domain + " Bee"), named("dd", scope));
}

for (let row = 0; row < 9; row++) {
  for (let column = 0; column < 9; column++) {
    const cell = named("div", "");
    const id = key(row, column);
    cells.set(id, { cell, row, column });
    get("arena").append(cell);
  }
}

function render() {
  const axis = get("axis").value;
  const combined = get("view").value === "combined";
  const spin = get("spin").value;
  const pattern = get("pattern").value;
  const positions = patternPositions(state, axis);
  const markers = [];
  if (pattern !== "reverse") markers.push(["normal", "N", positions.normal]);
  if (pattern !== "normal") markers.push(["reverse", "V", positions.reverse]);
  if (combined) {
    const { netPhase } = positions;
    markers.push(["combined", "Σ", netPhase === 0 ? [4, 4] : orbit[netPhase]]);
  } else {
    if (spin !== "right") markers.push(["left", "L", positions.left]);
    if (spin !== "left") markers.push(["right", "R", positions.right]);
  }
  for (const [id, { cell, row, column }] of cells) {
    const onTrail = axis === "vertical" ? column === 4 && trailValues.has(row) : row === 4 && trailValues.has(column);
    cell.className = ["farm-cell", orbitCells.has(id) && "orbit", onTrail && "track"].filter(Boolean).join(" ");
    cell.textContent = "";
  }
  for (const [name, letter, [row, column]] of markers) {
    const { cell } = cells.get(key(row, column));
    if (cell.textContent) cell.classList.add("overlap");
    cell.classList.add(name);
    cell.textContent += letter;
  }
  for (const lane of ["normal", "reverse", "left", "right"]) get(lane).textContent = state[lane].steps;
  get("net").textContent = positions.netSpin;
}

function step() {
  state = stepPattern(state, get("pattern").value, get("spin").value);
  render();
}

function pause() {
  clearInterval(timer);
  timer = undefined;
  get("run").textContent = "Run pattern";
}

get("run").addEventListener("click", () => {
  if (timer !== undefined) {
    pause();
    return;
  }
  timer = setInterval(step, 300);
  get("run").textContent = "Pause";
});
get("step").addEventListener("click", step);
get("reset").addEventListener("click", () => {
  pause();
  state = createPattern();
  render();
});
for (const id of ["axis", "view", "pattern", "spin"]) get(id).addEventListener("change", render);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) pause();
});

function renderTask() {
  const pending = task?.state === "proposed";
  get("propose").disabled = pending;
  get("approve").disabled = !pending;
  get("hold").disabled = !pending;
  if (!task) return;
  get("task").textContent = [task.authority, task.bee, task.ant, task.state, task.result, task.specialist].filter(Boolean).join(" · ");
}
get("propose").addEventListener("click", () => {
  if (task?.state === "proposed") return;
  task = propose(get("domain").value, get("specialist").checked);
  renderTask();
});
for (const decision of ["approve", "hold"]) get(decision).addEventListener("click", () => {
  if (!task) return;
  task = resolve(task, decision);
  renderTask();
});
render();
