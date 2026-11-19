import { swipeFrame } from './swipe.mjs';

/** Opt-in one-pointer swipe recognition for a simulated viewport; never calibrated yarn physics. */
export function attachSwipePointerSession(element, onSwipe, options = {}) {
  if (!element || typeof element.addEventListener !== 'function' || typeof element.removeEventListener !== 'function') throw new TypeError('event target required');
  if (typeof onSwipe !== 'function') throw new TypeError('onSwipe callback required');
  let active = null;
  let disposed = false;
  const usable = e => Number.isInteger(e.pointerId) && Number.isFinite(e.clientX) && Number.isFinite(e.clientY) &&
    ['touch', 'pen', 'mouse'].includes(e.pointerType);
  const point = e => ({ x: e.clientX, y: e.clientY, time: e.timeStamp });
  const down = e => {
    if (active || !usable(e) || !Number.isFinite(e.timeStamp) || (e.pointerType === 'mouse' && e.button !== 0)) return;
    active = { id: e.pointerId, start: point(e) };
  };
  const up = e => {
    if (!active || e.pointerId !== active.id) return;
    const start = active.start;
    active = null;
    if (!usable(e) || !Number.isFinite(e.timeStamp)) return;
    const result = swipeFrame(start, point(e), options);
    if (result.valid) onSwipe(Object.freeze({ ...result, pointerType: e.pointerType, simulated: true }));
  };
  const cancel = e => { if (active?.id === e.pointerId) active = null; };
  const listeners = [['pointerdown', down], ['pointerup', up], ['pointercancel', cancel], ['lostpointercapture', cancel]];
  for (const [name, fn] of listeners) element.addEventListener(name, fn);
  return Object.freeze({ dispose() {
    if (disposed) return;
    disposed = true;
    for (const [name, fn] of listeners) element.removeEventListener(name, fn);
    active = null;
  } });
}
