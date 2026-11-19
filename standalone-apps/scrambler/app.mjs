import { clock, createRoute, duration, sample, simulationExport } from './timeline.mjs';
import { describeScenario, draftScenario, importScenario, maxImportBytes, routeMetrics } from './scenario.mjs';

const element = id => document.getElementById(id);
const canvas = element('map');
const context = canvas.getContext('2d');
const seek = element('seek');
const play = element('play');
const steps = element('steps');
const textarea = element('scenario');
const savedKey = 'tabor.scrambler.scenario.v2';
let route = createRoute();
let draft;
let elapsed = 0;
let frame = 0;
let lastFrame = 0;
let running = false;
let previousState = '';

const road = [[0.09, 0.64], [0.28, 0.49], [0.47, 0.62], [0.58, 0.39], [0.73, 0.42]];
const dinner = road.at(-1);
const parking = [0.85, 0.63];

function drawMap(position) {
  const pixelRatio = window.devicePixelRatio || 1;
  const width = Math.round(canvas.clientWidth * pixelRatio);
  const height = Math.round(canvas.clientHeight * pixelRatio);
  if (!context || !width || !height) return;
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  const w = width / pixelRatio;
  const h = height / pixelRatio;
  context.fillStyle = '#101a29';
  context.fillRect(0, 0, w, h);

  function line(points, color, weight, dash = []) {
    context.beginPath();
    context.setLineDash(dash);
    for (const [i, [x, y]] of points.entries()) {
      if (i === 0) context.moveTo(x * w, y * h);
      else context.lineTo(x * w, y * h);
    }
    context.strokeStyle = color;
    context.lineWidth = weight;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.stroke();
    context.setLineDash([]);
  }

  for (let x = 0; x < 1; x += 0.06) line([[x, 0], [x, 1]], '#1d2b3e', 1);
  for (let y = 0; y < 1; y += 0.11) line([[0, y], [1, y]], '#1d2b3e', 1);
  line([[0, 0.27], [0.49, 0.29], [0.67, 0.59], [1, 0.45]], '#283c50', 6);
  line([[0.11, 0], [0.16, 0.26], [0.38, 0.79], [0.6, 1]], '#263b50', 6);
  line([[0.62, 0], [0.66, 0.21], [0.91, 0.39], [0.92, 1]], '#263b50', 6);
  line(road, '#415866', 16);
  line(road, '#9aaa89', 1, [5, 8]);
  line([dinner, parking], '#87916c', 2, [5, 6]);

  context.font = '600 11px system-ui';
  context.fillStyle = '#c2d1d9';
  const original = route[0].id === 'highway';
  context.fillText(original ? 'HIGHWAY' : 'START', .09 * w, .64 * h - 15);
  context.fillText(original ? 'DINNER' : 'CHECKPOINT', .73 * w - 26, .42 * h - 15);
  context.fillText(original ? 'PARKING' : 'FINISH', .85 * w - 20, .63 * h + 21);
  for (const [x, y] of [dinner, parking]) {
    context.fillStyle = '#aab689';
    context.beginPath();
    context.arc(x * w, y * h, 4, 0, Math.PI * 2);
    context.fill();
  }
  let marker = [dinner[0] + (parking[0] - dinner[0]) * (position - dinner[0]) / (1 - dinner[0]),
    dinner[1] + (parking[1] - dinner[1]) * (position - dinner[0]) / (1 - dinner[0])];
  if (position <= dinner[0]) {
    const scale = position / dinner[0] * (road.length - 1);
    const index = Math.min(Math.floor(scale), road.length - 2);
    const ratio = scale - index;
    marker = road[index].map((n, axis) => n + (road[index + 1][axis] - n) * ratio);
  }
  const [x, y] = marker;
  context.beginPath();
  context.arc(x * w, y * h, 11, 0, Math.PI * 2);
  context.fillStyle = '#d0f78344';
  context.fill();
  context.beginPath();
  context.arc(x * w, y * h, 5, 0, Math.PI * 2);
  context.fillStyle = '#e4ffaa';
  context.fill();
}

function update() {
  const state = sample(route, elapsed);
  element('speed').textContent = state.mph;
  element('elapsed').textContent = clock(state.elapsed);
  seek.value = Math.floor(state.elapsed);
  seek.setAttribute('aria-valuetext', clock(state.elapsed) + ' · ' + route[state.stage].label);
  const label = state.done ? 'Complete' : running ? route[state.stage].label : elapsed ? 'Paused' : 'Ready';
  if (label !== previousState) {
    element('state').textContent = label;
    previousState = label;
  }
  play.textContent = running ? 'Pause' : state.done ? 'Replay route' : elapsed ? 'Continue' : 'Play route';
  for (const [i, step] of [...steps.children].entries()) {
    if (i === state.stage) step.setAttribute('aria-current', 'step');
    else step.removeAttribute('aria-current');
  }
  drawMap(state.position);
}

function pause() {
  running = false;
  cancelAnimationFrame(frame);
  update();
}

function tick(at) {
  if (!running) return;
  elapsed = Math.min(elapsed + (at - lastFrame) / 1000 * Number(element('rate').value), duration(route));
  lastFrame = at;
  if (elapsed >= duration(route)) {
    pause();
    return;
  }
  update();
  frame = requestAnimationFrame(tick);
}

function buildSteps() {
  const total = duration(route);
  const totals = routeMetrics(route);
  seek.max = total;
  element('total').textContent = clock(total) + ' total';
  element('moving-total').textContent = clock(totals.travelSeconds);
  element('stopped-total').textContent = clock(totals.stopSeconds);
  element('distance-total').textContent = totals.miles.toFixed(2);
  let start = 0;
  steps.replaceChildren(...route.map(stage => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'step';
    const label = document.createElement('strong');
    const description = document.createElement('span');
    label.textContent = stage.label;
    description.textContent = clock(stage.seconds) + (stage.mph ? ' · ' + stage.mph + ' mph' : '');
    button.append(label, description);
    const offset = start;
    start += stage.seconds;
    button.addEventListener('click', () => {
      elapsed = offset;
      pause();
    });
    return button;
  }));
  update();
}

function applyRoute(next, label) {
  running = false;
  cancelAnimationFrame(frame);
  elapsed = 0;
  route = next;
  element('route-name').textContent = label;
  canvas.setAttribute('aria-label', 'Fictional schematic with ' + next.length + ' stages');
  buildSteps();
}

function clearDraft() {
  draft = undefined;
  element('draft-result').hidden = true;
  element('draft-message').textContent = '';
}

function review(next) {
  const list = element('draft-summary');
  list.replaceChildren(...next.map(stage => {
    const item = document.createElement('li');
    item.textContent = stage.label + ' · ' + clock(stage.seconds) + (stage.mph ? ' · ' + stage.mph + ' mph' : ' · Stop');
    return item;
  }));
  draft = next;
  element('draft-result').hidden = false;
  element('draft-message').textContent = 'Draft ready. Total ' + clock(duration(next)) + '.';
}

play.addEventListener('click', () => {
  if (running) {
    pause();
    return;
  }
  if (elapsed >= duration(route)) elapsed = 0;
  running = true;
  lastFrame = performance.now();
  update();
  frame = requestAnimationFrame(tick);
});
element('reset').addEventListener('click', () => {
  elapsed = 0;
  pause();
});
seek.addEventListener('input', () => {
  elapsed = Number(seek.value);
  pause();
});
element('rate').addEventListener('change', () => {
  if (running) lastFrame = performance.now();
});
element('settings').addEventListener('submit', event => {
  event.preventDefault();
  const next = createRoute(Object.fromEntries(new FormData(event.currentTarget)));
  applyRoute(next, 'Edited after dinner preset');
  textarea.value = describeScenario(next);
  clearDraft();
});
element('composer').addEventListener('submit', event => {
  event.preventDefault();
  clearDraft();
  try {
    review(draftScenario(textarea.value));
  } catch (error) {
    element('draft-message').textContent = error.message;
  }
});
textarea.addEventListener('input', clearDraft);
element('preset').addEventListener('click', () => {
  const next = createRoute();
  element('settings').reset();
  applyRoute(next, 'After dinner preset');
  textarea.value = describeScenario(next);
  clearDraft();
  element('draft-message').textContent = 'Original preset loaded.';
});
element('apply-draft').addEventListener('click', () => {
  if (!draft) return;
  applyRoute(draft, 'Nathan AI scenario');
  clearDraft();
  element('draft-message').textContent = 'Draft applied to playback.';
  play.focus();
});

const fileMessage = element('file-message');
element('save').addEventListener('click', () => {
  try {
    const data = JSON.stringify(simulationExport(route));
    localStorage.setItem(savedKey, data);
    importScenario(localStorage.getItem(savedKey));
    fileMessage.textContent = 'Playback route saved and verified on this browser.';
  } catch {
    fileMessage.textContent = 'This browser could not confirm a local save.';
  }
});
element('restore').addEventListener('click', () => {
  try {
    const data = localStorage.getItem(savedKey);
    if (!data) {
      fileMessage.textContent = 'There is no saved Scrambler route in this browser.';
      return;
    }
    clearDraft();
    const next = importScenario(data);
    textarea.value = describeScenario(next);
    review(next);
    fileMessage.textContent = 'Saved route loaded into the draft. Review it before applying.';
  } catch {
    fileMessage.textContent = 'This browser could not restore the saved route.';
  }
});
element('clear-saved').addEventListener('click', () => {
  try {
    localStorage.removeItem(savedKey);
    fileMessage.textContent = 'Saved route removed from this browser.';
  } catch {
    fileMessage.textContent = 'This browser could not remove local data.';
  }
});
let importRequest = 0;
element('import-file').addEventListener('change', async event => {
  const input = event.currentTarget;
  const file = input.files[0];
  input.value = '';
  if (!file) return;
  const request = ++importRequest;
  try {
    if (file.size > maxImportBytes) throw new Error('Choose a Scrambler file under 32 KB.');
    const next = importScenario(await file.text());
    if (request !== importRequest) return;
    textarea.value = describeScenario(next);
    review(next);
    fileMessage.textContent = 'File verified and loaded into the draft. Review it before applying.';
  } catch (error) {
    if (request !== importRequest) return;
    fileMessage.textContent = error instanceof SyntaxError ? 'This file does not contain valid JSON.' : error.message;
  }
});
element('download').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(simulationExport(route), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'scrambler-simulation.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
textarea.value = describeScenario(route);
new ResizeObserver(update).observe(canvas);
buildSteps();
