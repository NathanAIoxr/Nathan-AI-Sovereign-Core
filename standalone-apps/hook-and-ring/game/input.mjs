import { clamp } from './physics.mjs';

// The sibling TactileCoreSDK uses a guarded 50 ms contact history.
// This cartridge uses the same approach with a 16 ms lift guard.
export const HISTORY = 50;
export const GUARD = 16;
export const CSS_MM = 96 / 25.4;
export class OneEuro {
  constructor(minimum = 1.4, beta = 0.014) {
    this.minimum = minimum; this.beta = beta;
  }
  sample(value, time) {
    if (this.time === undefined) {
      this.value = value; this.raw = value; this.time = time; this.derivative = 0;
      return value;
    }
    if (time <= this.time) return this.value;
    const dt = clamp((time - this.time) / 1000, 0.001, 0.075);
    const alpha = cutoff => 1 / (1 + 1 / (2 * Math.PI * cutoff * dt));
    this.derivative += alpha(1) * ((value - this.raw) / dt - this.derivative);
    this.value += alpha(this.minimum + this.beta * Math.abs(this.derivative)) * (value - this.value);
    this.raw = value; this.time = time;
    return this.value;
  }
}
export function guardedRelease(history, time, guard = GUARD) {
  const last = history.findLast(point => point.t <= time - guard) ?? history[0];
  if (!last) return null;
  const first = history.find(point => point.t >= last.t - HISTORY && point.t <= last.t) ?? last;
  return { ...last, velocityX: (last.x - first.x) / Math.max(1, last.t - first.t), velocityY: (last.y - first.y) / Math.max(1, last.t - first.t) };
}
export function inBezel(x, y, width, height) {
  return x < width * 0.05 || x > width * 0.95 || y < height * 0.05 || y > height * 0.95;
}

export const MAX_CONTACTS = 10;
export const LIMB_PROFILES = Object.freeze({
  hand: { label: 'Hand', guard: 16 },
  toe: { label: 'Toe', guard: 20 },
});
export function trackSample(history, point) {
  if (!Number.isFinite(point.t) || point.t <= (history.at(-1)?.t ?? -Infinity)) return false;
  history.push(point);
  while (history.length > 2 && (history.length > 96 || history[1].t < point.t - 110)) history.shift();
  return true;
}
export function releaseSetup(grip, time, density, limb = 'hand') {
  const guard = (LIMB_PROFILES[limb] ?? LIMB_PROFILES.hand).guard;
  const point = guardedRelease(grip.history, time, guard);
  if (!point) return null;
  const all = [...grip.contacts.values()];
  const controls = all.map(contact => guardedRelease(contact.trail, time, guard)).filter(Boolean);
  let twist = 0;
  if (controls.length >= 2) {
    const left = all[0].start, right = all[1].start;
    const first = controls[0], last = controls[1];
    if (Math.hypot(right.x-left.x,right.y-left.y) >= density*5 &&
        Math.hypot(last.x-first.x,last.y-first.y) >= density*5) {
      const a = Math.atan2(right.y-left.y,right.x-left.x);
      const b = Math.atan2(last.y-first.y,last.x-first.x);
      twist = Math.atan2(Math.sin(b-a),Math.cos(b-a));
    }
  }
  return {
    point, twist, guard, contacts: all.length,
    velocity: { x: point.velocityX/density, y: point.velocityY/density },
    flick: clamp(-point.velocityY/density*2, -1, 1),
  };
}
