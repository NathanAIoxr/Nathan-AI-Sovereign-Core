import { attachPinchPointerSession } from './pinch-pointer-session.mjs';
import { applyPinchTrackball } from './pinch-trackball.mjs';
import { normalizeQuaternion } from './trackball.mjs';

/** Explicit opt-in bridge for simulated viewport gestures, not calibrated yarn physics.
 * Only attaches listeners to the supplied element. No persistence or network activity.
 */
export function attachPinchViewport(element, onChange, options = {}) {
  if (typeof onChange !== 'function') throw new TypeError('onChange callback required');
  const initial = normalizeQuaternion(options.orientation ?? [1, 0, 0, 0]);
  const initialZoom = options.zoom ?? 1;
  if (!Number.isFinite(initialZoom) || initialZoom <= 0) throw new RangeError('positive initial zoom required');
  let state = { orientation: initial, zoom: initialZoom, panX: 0, panY: 0, simulated: true };
  let disposed = false;
  const snapshot = () => Object.freeze({ ...state, orientation: Object.freeze([...state.orientation]) });
  const session = attachPinchPointerSession(element, frame => {
    if (disposed) return;
    state = {
      orientation: [...frame.orientation],
      zoom: state.zoom * frame.scale,
      panX: state.panX + frame.panX,
      panY: state.panY + frame.panY,
      simulated: true
    };
    onChange(snapshot());
  }, (previous, current) => applyPinchTrackball(state.orientation, previous, current, options));
  return Object.freeze({ getState: snapshot, dispose() { if (disposed) return; disposed = true; session.dispose(); } });
}
