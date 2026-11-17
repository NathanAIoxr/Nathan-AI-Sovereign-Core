// A simulation step is independent of the browser's display refresh rate.
export const PHYSICS_HZ = 240;
export const STEP = 1 / PHYSICS_HZ;
export function createClock() {
  let previous = null;
  let carry = 0;
  let ticks = 0;
  return {
    get ticks() { return ticks; },
    pause() { previous = null; carry = 0; },
    reset() { previous = null; carry = 0; ticks = 0; },
    frame(now, step) {
      const elapsed = previous === null ? 0 : Math.max(0, Math.min(50, now - previous));
      previous = now;
      carry += elapsed * PHYSICS_HZ / 1000;
      while (carry + 1e-9 >= 1) {
        carry -= 1;
        ticks++;
        if (step(STEP) === false) { carry = 0; break; }
      }
    },
  };
}
