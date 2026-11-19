import { Arena, boundary, height, targetPositions, width, zoneAt } from './physics.mjs';
import { incidentPlans, maxBalls } from './policy.mjs';

const $ = id => document.getElementById(id);
const main = $('main');
const currentLink = [...document.querySelectorAll('nav a')].find(link => link.pathname === location.pathname);
currentLink?.setAttribute('aria-current', 'page');
const sosKey = 'digital-flubber-contained';
const logKey = 'digital-flubber-activity';
const memory = {};
const read = key => { try { return localStorage.getItem(key) ?? memory[key]; } catch { return memory[key]; } };
const write = (key, value) => { memory[key] = value; try { localStorage.setItem(key, value); } catch {} };
function activity() {
  try { const log = JSON.parse(read(logKey) ?? '[]'); return Array.isArray(log) ? log : []; }
  catch { return []; }
}
function log(type, zone, detail) {
  write(logKey, JSON.stringify([{ time: new Date().toISOString(), type, zone, detail }, ...activity()].slice(0, 75)));
}
const isContained = () => read(sosKey) === 'true';
function setContainment(value) {
  if (isContained() !== value) {
    write(sosKey, String(value));
    log('SOS', 'arena', value ? 'Containment activated' : 'Containment lifted');
  }
}

let installPrompt;
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault(); installPrompt = event; $('install').hidden = false;
});
$('install').addEventListener('click', async () => { await installPrompt?.prompt(); $('install').hidden = true; installPrompt = null; });
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});

if ($('check-form')) {
  $('check-form').addEventListener('submit', async event => {
    event.preventDefault();
    const result = $('check-result');
    const button = event.currentTarget.querySelector('button');
    const query = new URLSearchParams(new FormData(event.currentTarget));
    button.disabled = true;
    result.textContent = 'Checking edge policy…';
    try {
      const response = await fetch('/api/permissions?' + query);
      if (![200, 403].includes(response.status)) throw new Error('Policy service unavailable');
      const decision = await response.json();
      result.textContent = decision.allowed ? 'Flubber allowed by the edge policy.' : 'Slubber blocked this action · ' + decision.reason;
      log(decision.allowed ? 'FLUBBER' : 'SLUBBER', query.get('zone'), 'Edge check: ' + decision.reason);
    } catch { result.textContent = 'Edge check unavailable.'; }
    finally { button.disabled = false; }
  });
}

if (main.dataset.page === 'sos') {
  function refresh() {
    const active = isContained();
    $('sos-state').textContent = active ? 'Containment active on this browser.' : 'Arena actions enabled on this browser.';
    $('contain').disabled = active;
    $('resume').disabled = !active;
    $('activity-rows').replaceChildren(...activity().map(event => {
      const row = document.createElement('tr');
      for (const value of [new Date(event.time).toLocaleTimeString(), event.type, event.zone, event.detail]) {
        const cell = document.createElement('td'); cell.textContent = value; row.append(cell);
      }
      return row;
    }));
  }
  let planRequest = 0;
  async function updatePlan() {
    const seq = ++planRequest;
    const scenario = $('scenario').value;
    let steps = incidentPlans[scenario], source = 'Built-in response guide';
    try {
      const response = await fetch('/api/sos?' + new URLSearchParams({ scenario }));
      if (!response.ok) throw new Error('SOS service unavailable');
      steps = (await response.json()).steps;
      source = 'Response guide from the SOS Worker';
    } catch {}
    if (seq !== planRequest) return;
    $('plan').replaceChildren(...steps.map(step => {
      const item = document.createElement('li'); item.textContent = step; return item;
    }));
    $('plan-source').textContent = source;
  }
  $('contain').addEventListener('click', () => { setContainment(true); refresh(); });
  $('resume').addEventListener('click', () => { setContainment(false); refresh(); });
  $('scenario').addEventListener('change', updatePlan);
  $('export').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify({ contained: isContained(), activity: activity() }, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'digital-flubber-activity.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  window.addEventListener('storage', refresh);
  refresh();
  updatePlan();
}

if ($('arena')) {
  const arena = new Arena();
  const canvas = $('arena');
  const ctx = canvas.getContext('2d');
  const arcade = main.dataset.page === 'game';
  const zoneCenters = { playground: 145, workbench: 465, vault: 740 };
  let drag = null;
  let wallMode = false;
  let last = performance.now();
  let carry = 0;
  let lastStats = 0;
  if (arcade) {
    arena.reset(true);
    $('game-status').hidden = false;
    $('reset').textContent = 'Restart run';
  }
  function message(text, denied = false) {
    $('message').textContent = text;
    $('message').classList.toggle('denied', denied);
  }
  const lastDenials = new Map();
  arena.onEvent = (type, zone, detail) => {
    const denied = type === 'SLUBBER';
    const now = Date.now();
    if (denied && now - (lastDenials.get(detail) || 0) < 800) return;
    if (denied) lastDenials.set(detail, now);
    log(type, zone, detail);
    message(type + ' · ' + zone + ' · ' + detail.replaceAll('-', ' '), denied);
  };
  function syncContainment() {
    arena.contained = isContained();
    for (const id of ['spawn','wall','reset','clear','fling','grant','restitution','stiffness','burst']) $(id).disabled = arena.contained;
    $('panic').textContent = arena.contained ? 'Resume arena' : 'Activate SOS';
    $('arena-state').textContent = arena.contained ? 'Contained' : 'Arena live';
    $('state-light').classList.toggle('halt', arena.contained);
    $('contained').hidden = !arena.contained;
    if (arena.contained) { drag = null; wallMode = false; $('instruction').textContent = 'Drag and release a ball to fling it.'; }
  }
  window.addEventListener('storage', event => { if (event.key === sosKey) syncContainment(); });
  $('panic').addEventListener('click', () => {
    setContainment(!arena.contained);
    syncContainment();
    message(arena.contained ? 'SOS · Motion and placements paused.' : 'SOS · Arena resumed.');
  });
  for (const key of ['restitution', 'stiffness', 'burst']) {
    $(key).addEventListener('input', () => {
      const value = Number($(key).value);
      arena.tune(key, value);
      $(key + '-val').value = key === 'burst' ? Math.round(value * 100) + '%' : key === 'restitution' ? value.toFixed(2) : value;
    });
  }
  $('grant').addEventListener('change', event => arena.grantVault(event.target.checked));
  $('spawn').addEventListener('click', () => {
    const count = $('count').valueAsNumber;
    if (!Number.isInteger(count) || count < 1 || count > maxBalls) { message('Enter a ball count from 1 to ' + maxBalls + '.', true); return; }
    const x = zoneCenters[$('zone').value];
    if (arena.balls.length >= maxBalls) { message('Ball capacity reached · ' + maxBalls + '.'); return; }
    arena.spawn(count, x, 180);
  });
  $('wall').addEventListener('click', () => {
    const x = zoneCenters[$('zone').value];
    if (arena.walls.length >= 16) { message('Wall capacity reached · 16.'); return; }
    arena.placeWall(x, 230);
  });
  canvas.addEventListener('contextmenu', event => event.preventDefault());
  function toggleWall() {
    wallMode = !wallMode;
    $('instruction').textContent = wallMode ? 'Tap the arena to position a wall.' : 'Drag and release a ball to fling it.';
    message(wallMode ? 'Choose a point in the arena.' : 'Wall placement canceled.');
  }
  canvas.addEventListener('keydown', event => {
    if (event.key.toLowerCase() === 'w' && !arena.contained) toggleWall();
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); $('fling').click(); }
  });
  $('reset').addEventListener('click', () => arena.reset(arcade));
  $('clear').addEventListener('click', () => {
    if (arena.contained) return;
    arena.balls.length = 0; arena.walls.length = 0; arena.sparks.length = 0;
    log('FLUBBER', 'arena', 'Objects cleared');
    message('Arena cleared.');
  });
  $('fling').addEventListener('click', () => {
    const ball = arena.balls[0];
    if (!ball) { message('Add a ball first.', true); return; }
    const [x, y] = targetPositions[arena.target % targetPositions.length];
    if (arcade) arena.fling(ball, (x - ball.x) / 3, (y - ball.y - 35) / 3);
    else arena.fling(ball, 112, -97);
  });
  function pointer(event) {
    const rect = canvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left) / rect.width * width, y: (event.clientY - rect.top) / rect.height * height };
  }
  canvas.addEventListener('pointerdown', event => {
    if (arena.contained || !event.isPrimary) return;
    const point = pointer(event);
    if (wallMode || event.button === 2) {
      arena.placeWall(point.x, point.y);
      if (wallMode) { wallMode = false; $('instruction').textContent = 'Drag and release a ball to fling it.'; }
      return;
    }
    if (event.button !== 0) return;
    const ball = [...arena.balls].reverse().find(item => Math.hypot(item.x - point.x, item.y - point.y) < item.r + 15);
    if (!ball) {
      if (zoneAt(point.x) === 'vault' && !arena.grant) arena.onEvent('SLUBBER', 'vault', 'Unauthorized entry blocked');
      return;
    }
    drag = { ball, ...point, startX: point.x, startY: point.y };
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', event => { if (drag && event.isPrimary) Object.assign(drag, pointer(event)); });
  canvas.addEventListener('pointerup', event => {
    if (!drag || !event.isPrimary) return;
    const point = pointer(event);
    arena.fling(drag.ball, point.x - drag.startX, point.y - drag.startY);
    drag = null;
  });
  canvas.addEventListener('pointercancel', () => { drag = null; });
  syncContainment();

  function text(value, x, y, color = '#74957a') {
    ctx.fillStyle = color; ctx.font = '700 12px ui-monospace, monospace'; ctx.fillText(value, x, y);
  }
  function draw(time) {
    const background = ctx.createLinearGradient(0, 0, width, height);
    background.addColorStop(0, '#16281a'); background.addColorStop(.8, '#0b150f');
    ctx.fillStyle = background; ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#344834'; ctx.globalAlpha = .75;
    for (let x = 13; x < width; x += 21) for (let y = 13; y < height; y += 21) ctx.fillRect(x, y, 1.4, 1.4);
    ctx.globalAlpha = 1;
    if (!arena.grant) { ctx.fillStyle = '#713d272b'; ctx.fillRect(boundary, 0, width - boundary, height); }
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = '#66886c88'; ctx.beginPath(); ctx.moveTo(326, 0); ctx.lineTo(326, height); ctx.stroke();
    ctx.strokeStyle = arena.grant ? '#82e85199' : '#ffab78aa';
    ctx.beginPath(); ctx.moveTo(boundary, 0); ctx.lineTo(boundary, height); ctx.stroke();
    ctx.setLineDash([]);
    text('PLAYGROUND', 16, 25); text('WORKBENCH', 343, 25);
    text(arena.grant ? 'VAULT · GRANTED' : 'VAULT · RESTRICTED', 661, 25, arena.grant ? '#a4f65a' : '#ffb282');
    if (arcade) {
      targetPositions.forEach(([x, y], i) => {
        ctx.strokeStyle = i === arena.target ? '#d4ffac' : i < arena.target ? '#66964f' : '#64725d';
        ctx.lineWidth = i === arena.target ? 3 : 1.5;
        ctx.beginPath(); ctx.arc(x, y, 23 + (i === arena.target ? Math.sin(time / 110) * 2 : 0), 0, 2 * Math.PI); ctx.stroke();
        text(String(i + 1), x - 4, y + 4, ctx.strokeStyle);
      });
      ctx.lineWidth = 1;
    }
    for (const wall of arena.walls) {
      ctx.fillStyle = '#264c22'; ctx.strokeStyle = '#a4f65a';
      ctx.fillRect(wall.x - 6, wall.y - 46, 12, 92); ctx.strokeRect(wall.x - 6, wall.y - 46, 12, 92);
    }
    for (const ball of arena.balls) {
      const { x, y, r, shape } = ball;
      const speed = Math.min(1, Math.hypot(ball.vx, ball.vy) / 755);
      const direction = Math.atan2(ball.vy, ball.vx);
      const halo = ctx.createRadialGradient(x, y, r * .45, x, y, r * 2.6);
      halo.addColorStop(0, '#79ff4e55'); halo.addColorStop(1, '#79ff4e00');
      ctx.fillStyle = halo; ctx.fillRect(x - r * 2.6, y - r * 2.6, r * 5.2, r * 5.2);
      const points = [...shape].map((deflection, i) => {
        const angle = i / shape.length * 2 * Math.PI;
        const radius = r + deflection + r * speed * Math.cos(angle - direction) ** 3 * .4;
        return [x + Math.cos(angle) * radius, y + Math.sin(angle) * radius];
      });
      ctx.beginPath();
      points.forEach(([px, py], i) => {
        const [nx, ny] = points[(i + 1) % points.length];
        const midpoint = [(px + nx) * .5, (py + ny) * .5];
        if (!i) ctx.moveTo(...midpoint);
        else ctx.quadraticCurveTo(px, py, ...midpoint);
      });
      ctx.quadraticCurveTo(...points[0], (points[0][0] + points[1][0]) / 2, (points[0][1] + points[1][1]) / 2);
      ctx.closePath();
      const fill = ctx.createRadialGradient(x - r * .4, y - r * .44, 1, x, y, r * 1.4);
      fill.addColorStop(0, '#efffc9'); fill.addColorStop(.28, '#b7fb54'); fill.addColorStop(.64, '#6de339'); fill.addColorStop(1, '#22883e');
      ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = '#ccff7cbb'; ctx.stroke();
    }
    for (const spark of arena.sparks) {
      ctx.globalAlpha = spark.life / .36; ctx.fillStyle = spark.blocked ? '#ffb282' : '#e1ffa5';
      ctx.fillRect(spark.x, spark.y, 3, 3);
    }
    ctx.globalAlpha = 1;
    if (drag) {
      ctx.setLineDash([4, 5]); ctx.strokeStyle = '#dbffb5'; ctx.beginPath();
      ctx.moveTo(drag.ball.x, drag.ball.y); ctx.lineTo(drag.x, drag.y); ctx.stroke(); ctx.setLineDash([]);
    }
  }
  function frame(time) {
    carry += Math.min(.05, (time - last) / 1000);
    last = time;
    const step = 1 / 180;
    while (carry >= step) { arena.step(step, drag?.ball.id); carry -= step; }
    draw(time);
    if (time - lastStats > 90) {
      const total = arena.balls.length;
      $('ball-total').textContent = total + (total === 1 ? ' ball' : ' balls');
      $('hit-total').textContent = arena.hits + (arena.hits === 1 ? ' impact' : ' impacts');
      if (arcade) $('game-status').textContent = arena.score === null
        ? 'Targets ' + arena.target + '/3 · ' + arena.elapsed.toFixed(1) + ' s'
        : 'Run complete · ' + arena.score.toFixed(1) + ' s';
      lastStats = time;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
