/** Keyboard alternative for simulated Track Baller viewport navigation.
 * Pure and opt-in at the UI layer; no DOM listeners, persistence, or measured yarn physics.
 */
export function keyboardViewportFrame(previous, key, options = {}) {
  if (!previous || !Number.isFinite(previous.zoom) || previous.zoom <= 0 || !Number.isFinite(previous.panX) || !Number.isFinite(previous.panY) || !Array.isArray(previous.orientation) || previous.orientation.length !== 4 || !previous.orientation.every(Number.isFinite)) throw new TypeError('valid viewport required');
  if (typeof key !== 'string') throw new TypeError('key must be a string');
  const { panStep = 16, zoomRatio = 1.1, minZoom = 0.1, maxZoom = 20, reducedMotion = false } = options;
  if (![panStep, zoomRatio, minZoom, maxZoom].every(Number.isFinite) || panStep <= 0 || zoomRatio <= 1 || minZoom <= 0 || maxZoom < minZoom || typeof reducedMotion !== 'boolean') throw new TypeError('invalid keyboard viewport options');
  const step = reducedMotion ? Math.min(panStep, 4) : panStep;
  const ratio = reducedMotion ? Math.min(zoomRatio, 1.02) : zoomRatio;
  const next = { zoom: previous.zoom, panX: previous.panX, panY: previous.panY };
  switch (key) {
    case 'ArrowLeft': next.panX -= step; break;
    case 'ArrowRight': next.panX += step; break;
    case 'ArrowUp': next.panY -= step; break;
    case 'ArrowDown': next.panY += step; break;
    case '+': case '=': next.zoom = Math.min(maxZoom, previous.zoom * ratio); break;
    case '-': case '_': next.zoom = Math.max(minZoom, previous.zoom / ratio); break;
    default: return Object.freeze({ ...previous, orientation: Object.freeze([...previous.orientation]), handled: false, simulated: true, verifiedPhysics: false });
  }
  return Object.freeze({ ...previous, ...next, orientation: Object.freeze([...previous.orientation]), handled: true, simulated: true, verifiedPhysics: false });
}
