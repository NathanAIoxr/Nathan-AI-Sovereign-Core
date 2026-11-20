import { applyPinchTrackball } from './pinch-trackball.mjs';
import { applyAccessibleGestureFrame } from './reduced-motion-gesture-bridge.mjs';

/** Compose real pinch geometry with opt-in viewport accessibility limits.
 * Pure simulated interface state; no measured yarn mechanics or persistence.
 */
export function applyAccessiblePinchFrame(previous, pointerBefore, pointerAfter, options = {}) {
  if (!previous || !Array.isArray(previous.orientation)) throw new TypeError('previous orientation required');
  const frame = applyPinchTrackball(previous.orientation, pointerBefore, pointerAfter, options);
  if (!frame.valid) return Object.freeze({ ...previous, orientation: Object.freeze([...previous.orientation]), valid: false, simulated: true, verifiedPhysics: false });
  const proposed = {
    orientation: frame.orientation,
    zoom: previous.zoom * frame.scale,
    panX: previous.panX + frame.panX,
    panY: previous.panY + frame.panY,
  };
  const guarded = applyAccessibleGestureFrame(previous, proposed, options);
  return Object.freeze({ ...guarded, valid: true });
}
