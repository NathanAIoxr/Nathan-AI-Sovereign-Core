import { clock, createRoute, duration, sample, simulationExport } from './timeline.mjs';

const element = id => document.getElementById(id);
const canvas = element('map');
const context = canvas.getContext('2d');
const seek = element('seek');
const play = element('play');
const steps = element('steps');
let route = createRoute();
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
  context.fillText('HIGHWAY', .09 * w, .64 * h - 15);
  context.fillText('DINNER', .73 * w - 15, .42 * h - 15);
  context.fillText('PARKING', .85 * w - 20, .63 * h + 21);
  for (const [x, y] of [dinner, parking]) {
    context.fillStyle = '#aab689';
    context.beginPath();
    context.arc(x * w, y * h, 4, 0, Math.PI * 2);
    context.fill();
  }
  let marker = parking;
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
  seek.max = total;
  element('total').textContent = clock(total) + ' total';
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
  elapsed = 0;
  pause();
  route = next;
  buildSteps();
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
new ResizeObserver(update).observe(canvas);
buildSteps();
