/** Opt-in two-pointer gesture session. Pointer IDs remain stable across reordering.
 * Emits simulated viewport frames only; no physical yarn calibration or network I/O.
 */
export function attachPinchPointerSession(element, onFrame, transform) {
  if (!element || typeof element.addEventListener !== 'function' || typeof element.removeEventListener !== 'function') throw new TypeError('event target required');
  if (typeof onFrame !== 'function' || typeof transform !== 'function') throw new TypeError('callbacks required');
  const active = new Map();
  let previous = null;
  let disposed = false;
  const point = e => ({ x: e.clientX, y: e.clientY });
  const usable = e => Number.isInteger(e.pointerId) && Number.isFinite(e.clientX) && Number.isFinite(e.clientY) && (e.pointerType === 'touch' || e.pointerType === 'pen' || e.pointerType === 'mouse');
  const pair = () => [...active.entries()].sort((a,b) => a[0]-b[0]).map(([,p]) => ({...p}));
  const down = e => {
    if (!usable(e) || active.has(e.pointerId) || active.size >= 2) return;
    active.set(e.pointerId, point(e));
    previous = active.size === 2 ? pair() : null;
  };
  const move = e => {
    if (!usable(e) || !active.has(e.pointerId)) return;
    active.set(e.pointerId, point(e));
    if (active.size !== 2) return;
    const current = pair();
    if (previous) {
      const result = transform(previous, current);
      if (result?.valid) onFrame(result);
    }
    previous = current;
  };
  const end = e => {
    if (!Number.isInteger(e.pointerId)) return;
    active.delete(e.pointerId);
    previous = null;
  };
  for (const [name, fn] of [['pointerdown',down],['pointermove',move],['pointerup',end],['pointercancel',end],['lostpointercapture',end]]) element.addEventListener(name,fn);
  return Object.freeze({dispose() {
    if (disposed) return;
    disposed = true;
    for (const [name, fn] of [['pointerdown',down],['pointermove',move],['pointerup',end],['pointercancel',end],['lostpointercapture',end]]) element.removeEventListener(name,fn);
    active.clear(); previous = null;
  }});
}
