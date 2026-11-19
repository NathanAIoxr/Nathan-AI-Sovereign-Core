import { move, start } from './game.mjs';

const el = id => document.getElementById(id);
const canvas = el('board');
const context = canvas.getContext('2d');
const orbit = el('orbit');
const buttons = [...document.querySelectorAll('[data-move]')];
const colors = { core: '#88ffcd', negative: '#c7a9ff', inverted: '#ffcf82' };
const keys = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'ccw', ArrowRight: 'cw' };
const pad = sector => String(sector).padStart(2, '0');
let board;
let state = start();
let routeItems = new Map();
let beaconItems = [];

function draw() {
  if (!board || !context) return;
  const { width, height } = canvas.getBoundingClientRect();
  if (!width || !height) return;
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  const selected = board.dimensions.findIndex(ring => ring.code === state.code);
  const angle = Number(orbit.value) * Math.PI / 180;
  const rx = Math.min(width * .31, 255);
  const ry = Math.min(rx * .28, height * .135);
  const spacing = (height - 2 * ry - 42) / 8;
  const pivotX = width * .48;
  const point = (index, y) => ({
    x: pivotX + rx * Math.cos(index * Math.PI * 2 / board.sectors + angle),
    y: y + ry * Math.sin(index * Math.PI * 2 / board.sectors + angle)
  });

  context.strokeStyle = '#314459';
  context.setLineDash([4, 7]);
  context.beginPath();
  context.moveTo(pivotX, 12);
  context.lineTo(pivotX, height - 12);
  context.stroke();
  context.setLineDash([]);

  for (let offset = -4; offset <= 4; offset++) {
    const ring = board.dimensions[(selected + offset + board.dimensions.length) % board.dimensions.length];
    const y = height / 2 + offset * spacing;
    const active = offset === 0;
    const color = colors[ring.zone];
    context.globalAlpha = active ? 1 : .6 - Math.abs(offset) * .065;
    context.lineWidth = active ? 2 : 1;
    context.strokeStyle = color;
    context.beginPath();
    context.ellipse(pivotX, y, rx, ry, 0, 0, Math.PI * 2);
    context.stroke();
    for (let sector = 0; sector < board.sectors; sector++) {
      const { x, y: sy } = point(sector, y);
      const player = active && sector === state.sector;
      const beacon = board.beacons.some(item => item.code === ring.code && item.sector === sector)
        && !state.collected.includes(ring.code + '/' + sector);
      context.fillStyle = player ? '#fff' : beacon ? '#ffcf82' : color;
      context.beginPath();
      if (beacon && !player) {
        context.moveTo(x, sy - 6);
        context.lineTo(x + 6, sy);
        context.lineTo(x, sy + 6);
        context.lineTo(x - 6, sy);
        context.closePath();
      } else context.arc(x, sy, player ? 7 : active ? 2.6 : 1.8, 0, Math.PI * 2);
      context.fill();
    }
    context.fillStyle = color;
    context.font = (active ? 'bold 15px' : '11px') + ' ui-monospace, monospace';
    context.fillText(ring.code, pivotX + rx + 10, y + 4);
  }
  context.globalAlpha = 1;
}

function render(message) {
  const ring = board.dimensions.find(item => item.code === state.code);
  el('position').textContent = state.code + ' / ' + pad(state.sector);
  el('level').textContent = ring.title + (ring.angular_step < 0 ? ' · rotation reversed' : '');
  el('moves').textContent = state.moves;
  el('count').textContent = state.collected.length + ' / ' + board.beacons.length;
  el('status').textContent = message;
  buttons.forEach(button => { button.disabled = state.won; });
  for (const [code, item] of routeItems) item.setAttribute('aria-current', String(code === state.code));
  for (const { beacon, item } of beaconItems) {
    const found = state.collected.includes(beacon.code + '/' + beacon.sector);
    item.dataset.found = found;
    item.firstChild.textContent = (found ? '✓ ' : '') + beacon.title;
  }
  draw();
}

function step(direction) {
  if (!board || state.won) return;
  const previous = state;
  state = move(board, state, direction);
  const announcements = [];
  if (state.event === 'FIRMAMENT_FLIP') announcements.push('Firmament Flip. Sector mirrored.');
  if (state.event === 'MAGNETIC_FIELD') announcements.push('Magnetic field crossed. Rotation reversed.');
  if (state.collected.length > previous.collected.length) {
    const beacon = board.beacons.find(item => item.code === state.code && item.sector === state.sector);
    announcements.push(beacon.title + ' collected.');
  }
  if (state.won) announcements.push('Run complete in ' + state.moves + ' moves.');
  if (!announcements.length) announcements.push(state.code + ', sector ' + pad(state.sector) + '.');
  render(announcements.join(' '));
}

buttons.forEach(button => button.addEventListener('click', () => step(button.dataset.move)));
el('reset').addEventListener('click', () => {
  state = start();
  render('Back at the Origin.');
});
orbit.addEventListener('input', draw);
new ResizeObserver(draw).observe(canvas);
document.addEventListener('keydown', event => {
  if (event.target.closest('input, button, [tabindex]') || !board || !keys[event.key]) return;
  event.preventDefault();
  step(keys[event.key]);
});

try {
  const response = await fetch('./board.json');
  if (!response.ok) throw new Error('Board request failed');
  board = await response.json();
  routeItems = new Map(board.dimensions.map(ring => {
    const item = document.createElement('span');
    item.className = 'coord mono';
    item.textContent = ring.code;
    el('route').append(item);
    return [ring.code, item];
  }));
  beaconItems = board.beacons.map(beacon => {
    const item = document.createElement('li');
    const title = document.createElement('span');
    const coord = document.createElement('span');
    coord.className = 'mono';
    coord.textContent = beacon.code + ' / ' + pad(beacon.sector);
    item.append(title, coord);
    el('beacons').append(item);
    return { beacon, item };
  });
  el('reset').disabled = false;
  render('Use the controls or arrow keys to move.');
} catch (error) {
  console.error(error);
  el('status').textContent = 'The board could not load. Reload to retry.';
}
