import {mountHive} from "../../tabor-hive/surface.mjs";
import v7Catalog from "../../tabor-universal-library-engine/public/catalog.json" with {type: "json"};
import {attachDigitTrackBaller} from "./digit-input.mjs";
import {clamp, decayMotion, TAU} from "./track-baller.mjs";
import {classes, modules} from "./loc101-catalog.mjs";
import {applyStroke, choose, completed, fieldForce, logicValues, markers, matchesModule,
  nearest, newScene, profiles, rotate, turn} from "./loc101-core.mjs";
import {draw} from "./loc101-view.mjs";

const byId = id => document.getElementById(id);
const elements = Object.fromEntries([
  "search","class-filter","finished-only","random","result-count","total-progress","module-list",
  "class-name","profile-name","module-title","brief","surface","canvas-label","workspace-progress",
  "guide","task","previous","record","next","zoom-out","zoom-in","reset","motion","sound","items","item-title","item-detail",
  "verse","jump","telemetry","status",
].map(id => [id, byId(id)]));
const canvas = elements.surface, ctx = canvas.getContext("2d");
const key = "tabor-loc101-v6";
const hive = mountHive({modules, classes, v7Ledger: v7Catalog.ledger});
const byNumber = new Map(modules.map(module => [module.id, module]));
let local = {};
try { local = JSON.parse(localStorage.getItem(key) ?? "{}") ?? {}; } catch {}
const finished = new Set(Array.isArray(local.finished) ? local.finished.filter(id => byNumber.has(id)) : []);
const selectedFromURL = () => byNumber.get(Number(new URL(location.href).searchParams.get("module")));
let scene = newScene(selectedFromURL() ?? byNumber.get(local.last) ?? modules[0]);
let result = [], lastStroke, gripOrigin, audio, soundedAt = 0, tilt = null, tiltEnabled = false;
let frameTime, frameNeeded = true, listButtons = new Map(), itemButtons = [];

for (const [code,name] of Object.entries(classes)) {
  elements["class-filter"].add(new Option(code + " — " + name, code));
}

function showList() {
  const query = elements.search.value, classCode = elements["class-filter"].value;
  result = modules.filter(module => matchesModule(module, query, classCode, classes,
    elements["finished-only"].checked, finished));
  elements["result-count"].textContent = result.length + " / " + modules.length + " modules";
  elements["total-progress"].textContent = finished.size + " completed";
  elements.random.disabled = !result.length;
  const collection = document.createDocumentFragment();
  listButtons = new Map();
  for (const module of result) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.module = module.id;
    button.setAttribute("aria-current", String(module.id === scene.module.id));
    for (const value of [String(module.id).padStart(3,"0"), module.title, finished.has(module.id) ? "✓" : ""]) {
      const span = document.createElement("span");
      span.textContent = value;
      button.append(span);
    }
    listButtons.set(module.id,button);
    collection.append(button);
  }
  if (!result.length) {
    const note = document.createElement("p");
    note.textContent = "No modules match these filters.";
    collection.append(note);
  }
  elements["module-list"].replaceChildren(collection);
}

function detail() {
  frameNeeded = true;
  const module = scene.module, item = module.items[scene.active];
  elements["item-title"].textContent = item.name;
  elements["item-detail"].textContent = module.profile === "logic"
    ? Object.entries(logicValues(scene.active)).map(([gate,value]) => gate + " " + (value ? "Yes" : "No")).join(" · ")
    : item.detail;
  elements.verse.hidden = !item.text;
  elements.verse.textContent = item.text ? item.text + " — KJV" : "";
  elements.jump.hidden = !item.classLink;
  elements.jump.textContent = item.classLink ? "Browse class " + item.classLink : "";
  const progress = module.profile === "link" ? scene.edges.size : scene.visited.size;
  const total = module.items.length - (module.profile === "link" ? 1 : 0);
  elements["workspace-progress"].textContent = progress + " / " + total;
  for (const [index, button] of itemButtons.entries()) {
    button.setAttribute("aria-pressed", String(index === scene.active));
    button.textContent = (scene.visited.has(index) ? "✓ " : (index + 1) + " · ") + module.items[index].name;
  }
  elements.telemetry.textContent = readout();
}

function readout() {
  const {profile,id} = scene.module;
  const signals = {
    orbit: () => "Q [" + scene.orientation.map(value => value.toFixed(2)).join(", ") + "] · zoom " + scene.zoom.toFixed(2) +
      (tilt ? " · relative tilt " + tilt.x.toFixed(0) + "°, " + tilt.y.toFixed(0) + "°" : ""),
    dial: () => "Dial " + (Math.round(scene.dial * 360 / TAU) % 360) + "°",
    trace: () => "Gesture " + scene.lastGesture + " · samples " + scene.trace.length,
    field: () => id === 63 ? "Relative field " + fieldForce([.20,.45,.80][scene.active]).toFixed(2) + " units"
      : scene.contacts.length + " live contacts · spread ×" + scene.gain.toFixed(2),
    flow: () => "Flow rate " + (scene.flow + scene.spin).toFixed(2) + " relative units",
    audio: () => (audio?.state === "running" ? "Sound enabled" : "Sound muted") + " · drive " + scene.gain.toFixed(2),
    link: () => scene.edges.size + " links built",
    logic: () => "Boolean gates · four input combinations",
  };
  return signals[profile]();
}

function present(module, updateURL = true) {
  controller.cancel();
  scene = newScene(module);
  hive.emit("module.open", {module: module.id, surface: "library"});
  const url = new URL(location.href);
  if (updateURL) {
    url.searchParams.set("module", module.id);
    history.replaceState(null,"",url);
  }
  elements["module-title"].textContent = module.title;
  elements["class-name"].textContent = module.classCode + " · " + classes[module.classCode];
  elements["profile-name"].textContent = profiles[module.profile].label;
  elements.brief.textContent = module.brief;
  elements.guide.textContent = profiles[module.profile].guide;
  elements.task.textContent = module.task;
  elements["canvas-label"].textContent = "MODULE " + String(module.id).padStart(3,"0");
  elements["zoom-out"].hidden = elements["zoom-in"].hidden = module.profile !== "orbit";
  elements.motion.hidden = module.profile !== "orbit" || typeof DeviceOrientationEvent === "undefined";
  elements.sound.hidden = module.profile !== "audio";
  elements.status.textContent = "";
  itemButtons = module.items.map((_, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.addEventListener("click", () => record(index));
    return button;
  });
  elements.items.replaceChildren(...itemButtons);
  detail();
  for (const [id,button] of listButtons) button.setAttribute("aria-current", String(id === module.id));
}

function update(message) {
  if (message) elements.status.textContent = message;
  if (completed(scene) && !finished.has(scene.module.id)) {
    finished.add(scene.module.id);
    hive.emit("module.complete", {module: scene.module.id});
    elements.status.textContent = (message ? message + " " : "") + "Module completed.";
    elements["total-progress"].textContent = finished.size + " completed";
    const button = listButtons.get(scene.module.id);
    if (button) button.lastElementChild.textContent = "✓";
    if (elements["finished-only"].checked) showList();
  }
  detail();
}

function reportInteraction(kind, before) {
  const payload = {surface: "library", kind, module: scene.module.id,
    orientation: scene.orientation, successes: Math.max(0, scene.visited.size - before)};
  if (scene.module.id === 63) payload.field = fieldForce([.20,.45,.80][scene.active]);
  hive.emit("interaction.summary", payload);
}

function record(index) {
  const before = scene.visited.size;
  const message = choose(scene,index);
  reportInteraction("tap", before);
  update(message);
  if (scene.module.profile === "audio") play(index);
}

function step(direction) {
  const count = scene.module.items.length;
  if (scene.module.profile === "dial") turn(scene, direction * TAU / count);
  else {
    scene.active = (scene.active + direction + count) % count;
    if (scene.module.profile === "orbit") rotate(scene, 0, direction * .36);
    if (scene.module.profile === "flow") scene.spin = clamp(scene.spin + direction * .22,-.8,1.4);
  }
  detail();
}

function play(index, length = .24, scrub = false) {
  if (audio?.state !== "running") return;
  const now = audio.currentTime;
  const module = scene.module.id;
  const tones = module === 49 ? [[220],[330],[440]] : module === 50 ? [[68],[158],[690]]
    : module === 51 ? [[262,330,392],[196,247,294],[220,262,330]]
    : module === 90 ? [[100],[900],[3800]] : [[110],[196],[294]];
  for (const frequency of tones[index]) {
    const oscillator = audio.createOscillator(), gain = audio.createGain(), filter = audio.createBiquadFilter();
    oscillator.type = module === 50 && index !== 0 ? "triangle" : module === 52 ? "sawtooth" : "sine";
    oscillator.frequency.setValueAtTime(frequency, now);
    if (module === 50 && index === 0) oscillator.frequency.exponentialRampToValueAtTime(34,now + length);
    filter.frequency.value = module === 52 ? [170,620,1800][index] * scene.gain : 7600;
    gain.gain.setValueAtTime(.0001,now);
    gain.gain.exponentialRampToValueAtTime(scrub ? .045 : .115,now + .025);
    gain.gain.exponentialRampToValueAtTime(.0001,now + length);
    oscillator.connect(filter).connect(gain).connect(audio.destination);
    oscillator.start(now); oscillator.stop(now + length);
    oscillator.onended = () => { oscillator.disconnect(); filter.disconnect(); gain.disconnect(); };
  }
}

function moving(stroke) {
  const previous = lastStroke ?? {dx:0,dy:0,dial:0};
  const dx = clamp(stroke.dx - previous.dx,-.5,.5), dy = clamp(stroke.dy - previous.dy,-.5,.5);
  const turnBy = stroke.dial - previous.dial;
  const {profile} = scene.module;
  if (profile === "orbit") rotate(scene,-dy * 4,dx * 4,clamp(turnBy,-.4,.4) * .48);
  if (profile === "dial") turn(scene, turnBy || dx * 3);
  if (profile === "trace") scene.trace = stroke.path;
  if (profile === "field") scene.contacts = [stroke.end];
  if (profile === "flow") scene.spin = clamp(dirWithFallback(stroke.rpm,dx),-1.4,1.4);
  if (profile === "audio" && performance.now() - soundedAt > 115) {
    soundedAt = performance.now();
    scene.gain = clamp(.45 + stroke.speed * .32,.45,1.8);
    scene.active = clamp(Math.floor((stroke.end.x + .46) * 3.3),0,2);
    play(scene.active,.14,true);
  }
  scene.lastGesture = stroke.kind;
  lastStroke = stroke;
  detail();
}
const dirWithFallback = (rpm, dx) => Math.abs(rpm) > 5 ? rpm / 190 : dx * 16;

function clearInput() {
  lastStroke = null;
  gripOrigin = null;
  scene.contacts = [];
  frameNeeded = true;
}

const controller = attachDigitTrackBaller(canvas,{
  onStart() { lastStroke = null; },
  onMove: moving,
  onEnd(stroke) {
    if (stroke.kind !== "tap" && stroke.kind !== "hold") moving(stroke);
    const before = scene.visited.size;
    const message = applyStroke(scene,stroke);
    reportInteraction(stroke.kind === "tap" ? "tap" : "gesture", before);
    if (message && scene.module.profile === "audio") play(scene.active);
    clearInput();
    update(message);
  },
  onCancel: clearInput,
  onGripStart() {
    gripOrigin = {zoom:scene.zoom, twist:0};
  },
  onGripMove(grip) {
    scene.contacts = grip.points;
    const {profile} = scene.module;
    if (!gripOrigin) return;
    if (profile === "orbit") {
      scene.zoom = clamp(gripOrigin.zoom * grip.scale,.55,1.62);
      rotate(scene,0,0,grip.twist - gripOrigin.twist);
    }
    if (profile === "dial") turn(scene,grip.twist - gripOrigin.twist);
    if (profile === "field" || profile === "audio") scene.gain = clamp(grip.scale,.4,1.9);
    if (profile === "flow") scene.spin = clamp(grip.twist,-1.4,1.4);
    gripOrigin.twist = grip.twist;
    scene.lastGesture = "pinch / twist";
    detail();
  },
  onGripEnd(grip) {
    if (grip.peakContacts < 2) { scene.contacts = []; frameNeeded = true; return; }
    if (scene.module.profile === "link") {
      const locations = markers(scene);
      const ids = [...new Set(grip.points.map(point => nearest(locations,point,.115)).filter(index => index !== -1))];
      if (ids.length === 2) { scene.pending = null; record(ids[0]); record(ids[1]); }
    }
    if (scene.module.profile === "audio") play(scene.active);
    if (scene.module.profile === "dial") record(scene.active);
    reportInteraction("pinch", scene.visited.size);
    clearInput();
    detail();
  },
  onGripCancel: clearInput,
});

elements["module-list"].addEventListener("click",event => {
  const button = event.target.closest("button[data-module]");
  if (button) present(byNumber.get(Number(button.dataset.module)));
});
elements.search.addEventListener("input",showList);
elements["class-filter"].addEventListener("change",showList);
elements["finished-only"].addEventListener("change",showList);
elements.random.addEventListener("click",() => {
  const candidates = result.length > 1 ? result.filter(module => module !== scene.module) : result;
  if (candidates.length) present(candidates[Math.floor(Math.random() * candidates.length)]);
});
elements.previous.addEventListener("click",() => step(-1));
elements.next.addEventListener("click",() => step(1));
function zoom(amount) {
  if (scene.module.profile !== "orbit") return;
  scene.zoom = clamp(scene.zoom + amount,.55,1.62);
  detail();
}
elements["zoom-out"].addEventListener("click",() => zoom(-.12));
elements["zoom-in"].addEventListener("click",() => zoom(.12));
elements.record.addEventListener("click",() => record(scene.active));
elements.reset.addEventListener("click",() => present(scene.module));
elements.jump.addEventListener("click",() => {
  const code = scene.module.items[scene.active].classLink;
  if (!code) return;
  elements["class-filter"].value = code;
  elements["finished-only"].checked = false;
  elements.search.value = "";
  showList();
  const next = result.find(module => module.id !== scene.module.id);
  if (next) {
    present(next);
    listButtons.get(next.id)?.focus();
  }
});

canvas.addEventListener("keydown",event => {
  const keys = {
    ArrowLeft: () => step(-1), ArrowRight: () => step(1),
    ArrowUp: () => step(1), ArrowDown: () => step(-1),
    Enter: () => record(scene.active), " ": () => record(scene.active),
    "+": () => zoom(.12), "-": () => zoom(-.12),
  };
  if (keys[event.key]) {
    event.preventDefault();
    keys[event.key]();
    detail();
  }
});
canvas.addEventListener("wheel",event => {
  if (scene.module.profile !== "orbit" || document.activeElement !== canvas) return;
  event.preventDefault();
  zoom(-Math.sign(event.deltaY) * .09);
},{passive:false});

let baseline = null;
function motion(event) {
  if (!Number.isFinite(event.gamma) || !Number.isFinite(event.beta)) return;
  baseline ??= {x:event.gamma,y:event.beta};
  tilt = {x:clamp(event.gamma - baseline.x,-35,35),y:clamp(event.beta - baseline.y,-35,35)};
}
elements.motion.addEventListener("click",async () => {
  if (tiltEnabled) {
    window.removeEventListener("deviceorientation",motion);
    tiltEnabled = false;
    baseline = tilt = null;
  } else {
    try {
      const available = typeof DeviceOrientationEvent.requestPermission !== "function" ||
        await DeviceOrientationEvent.requestPermission() === "granted";
      if (available) {
        window.addEventListener("deviceorientation",motion);
        tiltEnabled = true;
      } else {
        elements.status.textContent = "Tilt permission was declined.";
      }
    } catch { elements.status.textContent = "Tilt is unavailable on this device."; }
  }
  elements.motion.setAttribute("aria-pressed",String(tiltEnabled));
  elements.motion.textContent = tiltEnabled ? "Disable tilt" : "Enable tilt";
});
elements.sound.addEventListener("click",async () => {
  const Audio = window.AudioContext ?? window.webkitAudioContext;
  try {
    if (!Audio) throw new Error("No audio context");
    audio ??= new Audio();
    const on = elements.sound.getAttribute("aria-pressed") === "true";
    if (on) await audio.suspend();
    else await audio.resume();
    elements.sound.setAttribute("aria-pressed",String(!on));
    elements.sound.textContent = on ? "Enable sound" : "Mute sound";
    if (!on) play(scene.active);
  } catch { elements.status.textContent = "Sound is unavailable on this device."; }
  detail();
});

function tick(time) {
  const dt = Math.min((time - (frameTime ?? time)) / 1000,.05);
  frameTime = time;
  const {profile} = scene.module;
  const animated = profile === "flow" || profile === "audio";
  const usingTilt = profile === "orbit" && tilt && !lastStroke && !gripOrigin;
  if (animated) {
    scene.rotation = (scene.rotation + dt * (scene.flow + scene.spin) * 2.8) % TAU;
    scene.spin *= decayMotion(.985,dt).velocity;
  }
  if (usingTilt) {
    rotate(scene,tilt.y * dt * .018,tilt.x * dt * .018);
    elements.telemetry.textContent = readout();
  }
  if (ctx && (frameNeeded || animated || usingTilt)) draw(ctx,canvas,scene);
  frameNeeded = false;
  requestAnimationFrame(tick);
}

document.addEventListener("tabor-hive:surface-return", event => {
  const selected = byNumber.get(event.detail?.module);
  if (selected) present(selected);
  else hive.emit("module.open", {module: scene.module.id, surface: "library"});
});
new ResizeObserver(() => { frameNeeded = true; }).observe(canvas);
showList();
present(scene.module,false);
requestAnimationFrame(tick);
document.addEventListener("visibilitychange",() => {
  if (document.hidden) controller.cancel();
});
