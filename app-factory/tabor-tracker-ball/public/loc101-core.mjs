import {axisRotation, clamp, multiply, project, TAU} from "./track-baller.mjs";

// All coordinates are schematic workspace units. Sensor readings remain in the browser.
export const profiles = Object.freeze({
  orbit: {label: "3D orbit", guide: "Drag to rotate. Pinch or use the zoom controls. Select a marker to inspect it."},
  dial: {label: "Precision dial", guide: "Turn the dial or use the arrow keys. Select the active stop to record it."},
  trace: {label: "Stroke path", guide: "Draw through the numbered markers in one stroke, or activate the numbered buttons in order."},
  field: {label: "Contact field", guide: "Hold or move contacts to deform the grid. Select a preset to inspect its response."},
  flow: {label: "Flow simulator", guide: "Drag or swirl to stir the flow. Select a preset to change the simulation."},
  audio: {label: "Audio controller", guide: "Enable sound to hear synthesized samples. Tap a marker, or scrub the surface to vary the sound."},
  link: {label: "Node network", guide: "Select two adjacent nodes to link them. You can also touch two nodes at once."},
  logic: {label: "Logic table", guide: "Choose an input pair to compute AND, OR and XOR."},
});

const atAngle = (angle, radius) => ({x: Math.sin(angle) * radius, y: -Math.cos(angle) * radius});
const cycle = (value, size) => ((value % size) + size) % size;

export function newScene(module) {
  return {
    module, active: 0, visited: new Set(), edges: new Set(), pending: null, cursor: 0,
    contacts: [], orientation: [1, 0, 0, 0], zoom: 1, dial: 0, spin: 0,
    flow: 0.45, rotation: 0, trace: [], lastGesture: "—", gain: 1,
  };
}

export function choose(scene, index) {
  const count = scene.module.items.length;
  if (!Number.isInteger(index) || index < 0 || index >= count) return "";
  scene.active = index;
  const {profile, items} = scene.module;
  const item = items[index];
  if (profile === "trace") {
    if (index !== scene.cursor) return "Next checkpoint is " + items[scene.cursor].name + ".";
    scene.cursor = cycle(scene.cursor + 1, count);
  }
  if (profile === "link") {
    if (scene.pending === null || scene.pending === index) {
      scene.pending = index;
      return "Selected " + item.name + ". Choose an adjacent node.";
    }
    const first = scene.pending;
    scene.pending = null;
    if (Math.abs(first - index) !== 1) return "These nodes have no direct connection. Link through the middle node.";
    scene.edges.add(Math.min(first, index));
    scene.visited.add(first);
    scene.visited.add(index);
    return items[first].name + " linked to " + item.name + ".";
  }
  if (profile === "dial") scene.dial = index * TAU / count;
  if (profile === "flow") scene.flow = [0.22, 0.65, 1.15, 1.45][index];
  scene.visited.add(index);
  return item.name + " recorded.";
}

export function completed(scene) {
  if (scene.module.profile === "link") return scene.edges.size === scene.module.items.length - 1;
  return scene.visited.size === scene.module.items.length;
}

export function rotate(scene, x, y, z = 0) {
  scene.orientation = multiply(axisRotation(x, y, z), scene.orientation);
}

export function turn(scene, amount) {
  scene.dial = cycle(scene.dial + amount, TAU);
  scene.active = cycle(Math.round(scene.dial / TAU * scene.module.items.length), scene.module.items.length);
}

export function markers(scene) {
  const {id, profile, items} = scene.module;
  if (profile === "trace") {
    const paths = {
      13: [[-.32,.18],[0,-.24],[.32,.18]], 28: [[-.32,.16],[.08,-.20],[.33,.21]],
      29: [[-.34,.18],[-.05,-.16],[.32,-.04]], 35: [[-.24,-.28],[.20,-.08],[.04,.29]],
      43: [[-.32,-.25],[0,.24],[.32,-.25]], 55: [[-.28,.2],[.14,-.25],[.18,.15]],
      57: [[-.3,-.19],[-.03,.18],[.31,-.06]], 61: [[-.31,.10],[.02,-.24],[.31,.16]],
      68: [[-.32,.10],[-.04,-.14],[.30,-.04]], 71: [[-.30,-.12],[.03,.16],[.31,-.06]],
    };
    return (paths[id] ?? [[-.32,.17],[0,-.22],[.32,.17]]).map(([x, y]) => ({x, y}));
  }
  if (profile === "orbit") {
    return items.map((_, index) => {
      const angle = index * TAU / items.length - Math.PI;
      const z = index % 2 ? 0.32 : 0.48;
      const [x, y, depth] = project(scene.orientation, [Math.cos(angle) * .29, Math.sin(angle) * .27, z * .40]);
      return {x: x * scene.zoom, y: y * scene.zoom, depth};
    });
  }
  if (profile === "link") {
    return items.map((_, index) => ({x: -.34 + index * .34, y: index === 1 ? -.16 : .12}));
  }
  return items.map((_, index) => atAngle(index * TAU / items.length, .31));
}

export function nearest(points, p, tolerance) {
  let choice = -1;
  for (const [i, mark] of points.entries()) {
    const distance = Math.hypot(mark.x - p.x, mark.y - p.y);
    if (distance < tolerance) {
      tolerance = distance;
      choice = i;
    }
  }
  return choice;
}

export function traceMatches(path, points, radius = .067) {
  let step = 0;
  for (let index = 0; index < path.length && step < points.length; index++) {
    const end = path[index], start = path[index - 1] ?? end;
    const dx = end.x - start.x, dy = end.y - start.y;
    const lengthSquared = dx * dx + dy * dy;
    const mark = points[step];
    const t = lengthSquared ? clamp(((mark.x - start.x) * dx + (mark.y - start.y) * dy) / lengthSquared, 0, 1) : 0;
    if (Math.hypot(mark.x - start.x - t * dx, mark.y - start.y - t * dy) <= radius) step++;
  }
  return step === points.length;
}

export function applyStroke(scene, stroke) {
  scene.lastGesture = stroke.kind;
  const {profile} = scene.module;
  if (profile === "trace" && stroke.kind !== "tap") {
    scene.trace = stroke.path;
    if (!traceMatches(stroke.path, markers(scene))) return "Try again. Cross the numbered checkpoints in order.";
    scene.cursor = 0;
    scene.module.items.forEach((_, index) => choose(scene, index));
    return "Stroke recorded. All checkpoints crossed in order.";
  }
  if (profile === "dial" && stroke.kind !== "tap") return choose(scene, scene.active);
  if (stroke.kind === "tap" || stroke.kind === "hold") {
    const index = nearest(markers(scene), stroke.end, .105);
    return choose(scene, index);
  }
  if (profile === "flow") scene.spin = clamp(stroke.rpm / 250, -1.4, 1.4);
  return "";
}

export function fieldForce(distance, strength = 1) {
  // A softening radius keeps the illustrative field finite at each contact.
  return strength / (distance * distance + .0225);
}

export function logicValues(index) {
  const yes = [true, true, false, false][index];
  const other = index % 2 === 0;
  return {AND: yes && other, OR: yes || other, XOR: yes !== other};
}

export function matchesModule(module, query, classCode, classes, finishedOnly, finished) {
  if (classCode && module.classCode !== classCode) return false;
  if (finishedOnly && !finished.has(module.id)) return false;
  const searchable = [String(module.id), module.title, module.briefTitle, module.brief,
    classes[module.classCode], profiles[module.profile].label, ...module.items.map(item => item.name)].join(" ").toLowerCase();
  return query.toLowerCase().trim().split(/\s+/).every(term => searchable.includes(term));
}
