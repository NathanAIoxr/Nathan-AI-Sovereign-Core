// Hook & Ring by Nathan Tabor. Fixed-length spherical pendulum, SI units.
export const STEP = 1 / 240;
export const ROPE = 2;
export const HOOK = Object.freeze({ x: 0, z: 1.47, y: -Math.sqrt(ROPE ** 2 - 1.47 ** 2) });
export const MODES = Object.freeze({
  practice: 'Practice', 'first5': 'First to 5', 'first11': 'First to 11', 'first21': 'First to 21',
  ladder: 'Tug of War', streak: 'Sudden Death', trick: 'Trick Shots', breeze: 'Porch Breeze', daily: 'Daily Tournament',
});
export const SKINS = [
  { name: 'Brass', color: '#ffd183', catches: 0 },
  { name: 'Copper', color: '#ff8e73', catches: 5 },
  { name: 'Jade', color: '#81e7ba', catches: 15 },
  { name: 'Chrome', color: '#dde3fc', catches: 35 },
];
export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
export const defaultThrow = Object.freeze({ pull: 0.49, aim: 0, flick: 0 });
const LIMIT_MS = 120_000;
export const DAILY_MS = LIMIT_MS;
export const DAILY_SHOTS = 10;
export function normalizeThrow({ pull, aim, flick }) {
  return { pull: +clamp(pull, 0, 1).toFixed(4), aim: +clamp(aim, -1, 1).toFixed(4), flick: +clamp(flick, -1, 1).toFixed(4) };
}
export function hashSeed(value) {
  let result = 2166136261;
  for (const letter of String(value)) result = Math.imul(result ^ letter.charCodeAt(0), 16777619);
  return result >>> 0;
}
export function breezeFor(seed, shot) {
  let v = hashSeed(`${seed}:${shot}`);
  v ^= v << 13; v ^= v >>> 17; v ^= v << 5;
  const f = (v >>> 0) / 4294967295;
  const lateral = (f < 0.5 ? -1 : 1) * (0.12 + 0.28 * Math.abs(f * 2 - 1));
  return { lateral, direction: lateral < 0 ? 'left' : 'right' };
}
export function competitionWind(code, round, turn) {
  const seed = parseInt(code.slice(0,6),16);
  return Math.sin((seed + Math.floor(turn/2)*37 + round*11)*1.21)*.105;
}
export function heldPoint(raw = defaultThrow) {
  const { pull, aim } = normalizeThrow(raw);
  const heading = aim * 0.24;
  const reach = ROPE * Math.sin(0.30 + pull * 1.18);
  return { x: -reach * Math.sin(heading), y: -ROPE * Math.cos(0.30 + pull * 1.18), z: -reach * Math.cos(heading) };
}
const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
function tangent(velocity, position) {
  const scale = dot(velocity, position) / (ROPE * ROPE);
  return { x: velocity.x - scale * position.x, y: velocity.y - scale * position.y, z: velocity.z - scale * position.z };
}
export function createShot(raw, wind = 0) {
  const shot = normalizeThrow(raw);
  const p = heldPoint(shot);
  return { p, v: tangent({x: 0,y: 0,z: shot.flick * 1.1}, p), wind, time: 0, peak: p.z, result: null };
}
function finish(state, outcome, detail, contact = state.p, speed = 0) {
  state.result = { outcome, detail, ms: Math.round(state.time * 1000), lateral: Math.round(contact.x * 1000), depth: Math.round(state.peak * 1000), speed: Math.round(speed * 1000) };
  return state.result;
}
export function advanceShot(state) {
  if (state.result) return state.result;
  const prev = state.p;
  const a = tangent({ x: state.wind, y: -9.81, z: 0 }, prev);
  const damping = Math.exp(-0.052 * STEP);
  let v = { x:(state.v.x+a.x*STEP)*damping, y:(state.v.y+a.y*STEP)*damping, z:(state.v.z+a.z*STEP)*damping };
  const next = { x:prev.x+v.x*STEP, y:prev.y+v.y*STEP, z:prev.z+v.z*STEP };
  const length = Math.hypot(next.x, next.y, next.z);
  const p = { x:next.x*ROPE/length, y:next.y*ROPE/length, z:next.z*ROPE/length };
  v = tangent(v, p);
  state.p = p; state.v = v; state.time += STEP;
  state.peak = Math.max(state.peak, p.z);
  // Sweep the ring center through the hook plane between steps. The inner
  // aperture clears the hook nose, while the outer radius can hit its rim.
  if (prev.z < HOOK.z && p.z >= HOOK.z && v.z > 0) {
    const t = (HOOK.z - prev.z) / (p.z - prev.z);
    const contact = { x:prev.x+t*(p.x-prev.x), y:prev.y+t*(p.y-prev.y), z:HOOK.z };
    const offset = Math.hypot(contact.x - HOOK.x, contact.y - HOOK.y);
    if (offset <= 0.052 && v.z >= 0.12 && v.z <= 1.13) {
      state.p = { ...HOOK };
      return finish(state, 'catch', 'Clean catch', contact, v.z);
    }
    if (offset <= 0.106) return finish(state, 'rim', v.z > 1.13 ? 'Too much speed' : 'Clipped the rim', contact, v.z);
    return finish(state, 'miss', contact.x < 0 ? 'Left of the hook' : 'Right of the hook', contact, v.z);
  }
  if ((state.time > 0.5 && p.z > 0.10 && v.z <= 0) || state.time >= 3) {
    return finish(state, 'miss', 'Short of the hook');
  }
  return null;
}
export function simulateShot(raw, wind = 0) {
  const state = createShot(raw, wind);
  while (!state.result) advanceShot(state);
  return state.result;
}
export const TRICKS = [
  { label:'Soft touch', tip:'Make a clean catch below 0.55 m/s.', wind:0, passes: result => result.speed<550 },
  { label:'Against the breeze', tip:'Aim left to counter a strong rightward breeze.', wind:.40, passes:()=>true },
  { label:'Center cut', tip:'Finish within 20 mm of center in a leftward breeze.', wind:-.29, passes:result=>Math.abs(result.lateral)<=20 },
];
export function trickResult(result, attempt) {
  const trick=TRICKS[attempt%TRICKS.length];
  if(result.outcome!=='catch' || trick.passes(result)) return result;
  return {...result,outcome:'rim',detail:'Caught, but missed the trick target'};
}
export function freshMatch(mode) {
  return { mode, scores: [0,0], attempts: 0, player: 0, ladder: 0, ended: false, winner: null };
}
export function recordShot(match, outcome, twoPlayers = false) {
  if (match.ended) return match;
  const next = { ...match, scores: [...match.scores], attempts: match.attempts + 1 };
  const caught = outcome === 'catch';
  if (caught) next.scores[match.player]++;
  if (match.mode.startsWith('first') && next.scores[match.player] >= Number(match.mode.slice(5))) {
    next.ended = true; next.winner = match.player;
  } else if (match.mode === 'ladder') {
    next.ladder = clamp(match.ladder + (caught ? (match.player === 0 ? 1 : -1) : 0), -3, 3);
    if (Math.abs(next.ladder) === 3) { next.ended = true; next.winner = match.player; }
  } else if (match.mode === 'streak' && !caught) {
    next.ended = true;
  } else if (match.mode === 'trick' && next.attempts >= TRICKS.length) {
    next.ended = true;
  } else if (match.mode === 'daily' && next.attempts >= DAILY_SHOTS) {
    next.ended = true;
  }
  if (twoPlayers && !next.ended) next.player = 1 - match.player;
  return next;
}
const tournamentDate = new Intl.DateTimeFormat('en-US',{
  timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit',
});
export function dayKey(date = new Date()) {
  const parts=Object.fromEntries(tournamentDate.formatToParts(date).map(({type,value})=>[type,value]));
  return parts.year+'-'+parts.month+'-'+parts.day;
}
