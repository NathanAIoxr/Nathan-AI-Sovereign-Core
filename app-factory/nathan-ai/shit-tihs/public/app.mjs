import { advance, createGame, objective, stages } from './game.mjs';
import { draw } from './draw.mjs';

const find = (id) => document.getElementById(id);
const arcade = find('game');
const canvas = find('scene');
const overlay = find('overlay');
const startButton = find('start');
const pauseButton = find('pause');
const soundButton = find('sound');
const ctx = canvas.getContext('2d');
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const heldKeys = new Map();
const heldPointers = new Map();
const presses = new Set();
const keyActions = new Map([
  ['ArrowLeft', 'left'], ['KeyA', 'left'], ['ArrowRight', 'right'], ['KeyD', 'right'],
  ['ArrowUp', 'jump'], ['KeyW', 'jump'], ['Space', 'jump'],
  ['KeyX', 'brush'], ['KeyJ', 'flip']
]);

let game = createGame();
let mode = 'intro';
let best = Number(read('shit-tihs-best')) || 0;
let sound = read('shit-tihs-sound') === 'on';
let audioContext;
let previous = 0;
let accumulated = 0;
let frame = 0;
const tick = 1 / 60;

function read(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}

function write(key, value) {
  try { localStorage.setItem(key, value); } catch { /* The game also works without storage. */ }
}

function show(id, value) {
  const element = find(id);
  const next = String(value);
  if (element.textContent !== next) element.textContent = next;
}

function hud() {
  show('stage-stat', `0${game.stageIndex + 1} / 0${stages.length}`);
  show('time-stat', Math.ceil(game.time));
  show('score-stat', String(game.score).padStart(5, '0'));
  show('best-stat', String(best).padStart(5, '0'));
  show('objective', objective(game));
  find('rats').value = Math.round(game.rats);
}

function watch() {
  frame = requestAnimationFrame(update);
}

function update(now) {
  frame = 0;
  if (mode !== 'play') return;
  accumulated += previous ? Math.min((now - previous) / 1000, .1) : tick;
  previous = now;
  while (accumulated >= tick && !game.ending) {
    const held = new Set([...heldKeys.values(), ...heldPointers.values()]);
    advance(game, {
      left: held.has('left') || presses.has('left'),
      right: held.has('right') || presses.has('right'),
      jump: presses.has('jump'),
      brush: presses.has('brush'),
      flip: presses.has('flip')
    }, tick);
    presses.clear();
    for (const event of game.events) playTone(event);
    accumulated -= tick;
  }
  hud();
  draw(ctx, game, motion.matches);
  if (game.ending) finish();
  else watch();
}

function releaseAll() {
  heldKeys.clear();
  heldPointers.clear();
  presses.clear();
  document.querySelectorAll('.is-down').forEach(button => button.classList.remove('is-down'));
}

function resetTiming() {
  previous = 0;
  accumulated = 0;
  if (frame) cancelAnimationFrame(frame);
  frame = 0;
}

function panel(label, title, detail, action) {
  resetTiming();
  releaseAll();
  show('panel-label', label);
  show('panel-title', title);
  show('panel-detail', detail);
  startButton.firstChild.textContent = `${action} `;
  overlay.hidden = false;
  startButton.focus({ preventScroll: true });
}

function start() {
  const nextStage = mode === 'clear' ? game.stageIndex + 1 : 0;
  if (mode !== 'pause') game = createGame(nextStage, mode === 'clear' ? game.score : 0);
  mode = 'play';
  releaseAll();
  resetTiming();
  overlay.hidden = true;
  pauseButton.disabled = false;
  arcade.focus({ preventScroll: true });
  hud();
  draw(ctx, game, motion.matches);
  prepareAudio();
  watch();
}

function pause() {
  if (mode !== 'play') return;
  mode = 'pause';
  panel('PAUSED', game.stage.title, 'Your timer is stopped.', 'Resume');
}

function finish() {
  mode = game.ending;
  pauseButton.disabled = true;
  if (game.score > best) {
    best = game.score;
    write('shit-tihs-best', best);
  }
  hud();
  if (mode === 'clear') {
    panel('STAGE CLEAR', game.stage.title, `Score ${game.score.toLocaleString()} · Next up: ${stages[game.stageIndex + 1].title}`, 'Next stage');
  } else if (mode === 'win') {
    panel('ALL STAGES CLEAR', 'THE STAR U R', `Final score ${game.score.toLocaleString()}. The crew is clocking out.`, 'Play again');
  } else {
    const title = mode === 'rats' ? 'THE RATS GOT IN' : 'TIME RAN OUT';
    panel('GAME OVER', title, `Score ${game.score.toLocaleString()} · Best ${best.toLocaleString()}`, 'Try again');
  }
}

const tones = {
  jump: [310, 410], brush: [120, 75], paint: [370, 550], flip: [280, 900],
  relic: [530, 720], hit: [132, 68], clear: [480, 960]
};

function prepareAudio() {
  if (!sound) return;
  try {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    audioContext ??= new Audio();
    void audioContext.resume().catch(() => {});
  } catch { /* Audio support varies by browser. */ }
}

function playTone(event) {
  if (!sound || audioContext?.state !== 'running') return;
  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const [from, to] = tones[event];
  oscillator.type = 'triangle';
  oscillator.frequency.setValueAtTime(from, now);
  oscillator.frequency.exponentialRampToValueAtTime(to, now + .13);
  gain.gain.setValueAtTime(.09, now);
  gain.gain.exponentialRampToValueAtTime(.0001, now + .17);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + .17);
}

function syncSound() {
  soundButton.setAttribute('aria-pressed', String(sound));
  show('sound-state', sound ? 'ON' : 'OFF');
}

startButton.addEventListener('click', start);
pauseButton.addEventListener('click', () => mode === 'pause' ? start() : pause());
soundButton.addEventListener('click', () => {
  sound = !sound;
  write('shit-tihs-sound', sound ? 'on' : 'off');
  syncSound();
  prepareAudio();
  playTone('paint');
});
find('print').addEventListener('click', () => window.print());

document.addEventListener('keydown', event => {
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  if (!arcade.contains(document.activeElement) && document.activeElement !== document.body) return;
  if (['KeyP', 'Escape'].includes(event.code) && ['play', 'pause'].includes(mode) && !event.repeat) {
    event.preventDefault();
    if (mode === 'play') pause();
    else start();
    return;
  }
  if (mode !== 'play') return;
  if (event.code === 'Space' && event.target instanceof HTMLButtonElement) return;
  const action = keyActions.get(event.code);
  if (!action) return;
  event.preventDefault();
  if (!heldKeys.has(event.code)) presses.add(action);
  heldKeys.set(event.code, action);
});
document.addEventListener('keyup', event => heldKeys.delete(event.code));
window.addEventListener('blur', () => {
  if (mode === 'play') pause();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden && mode === 'play') pause();
});

for (const button of document.querySelectorAll('[data-hold]')) {
  const action = button.dataset.hold;
  button.addEventListener('pointerdown', event => {
    if (mode !== 'play' || event.button !== 0) return;
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    heldPointers.set(event.pointerId, action);
    presses.add(action);
    button.classList.add('is-down');
  });
  const release = event => {
    heldPointers.delete(event.pointerId);
    if (![...heldPointers.values()].includes(action)) button.classList.remove('is-down');
  };
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('lostpointercapture', release);
  button.addEventListener('click', event => {
    if (mode === 'play' && event.detail === 0) presses.add(action);
  });
}

let installPrompt;
const installButton = find('install');
if (!matchMedia('(display-mode: standalone)').matches && !navigator.standalone) {
  installButton.hidden = false;
}
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  installPrompt = event;
});
window.addEventListener('appinstalled', () => { installButton.hidden = true; });
installButton.addEventListener('click', async () => {
  if (installPrompt) {
    const prompt = installPrompt;
    installPrompt = undefined;
    await prompt.prompt();
  } else {
    find('install-help').showModal();
  }
});
find('close-install').addEventListener('click', () => find('install-help').close());

syncSound();
hud();
draw(ctx, game, motion.matches);
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
