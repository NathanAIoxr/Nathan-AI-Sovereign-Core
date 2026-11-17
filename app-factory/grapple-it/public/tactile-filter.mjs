const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

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
export function guardedRelease(history, time) {
  const last = history.findLast(point => point.t <= time - GUARD) ?? history[0];
  if (!last) return null;
  const first = history.find(point => point.t >= last.t - HISTORY && point.t <= last.t) ?? last;
  return { ...last, velocityY: (last.y - first.y) / Math.max(1, last.t - first.t) };
}
export function inBezel(x, y, width, height) {
  return x < width * 0.05 || x > width * 0.95 || y < height * 0.05 || y > height * 0.95;
}
