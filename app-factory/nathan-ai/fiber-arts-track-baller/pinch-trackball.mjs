import { pinchFrame } from './pinch.mjs';
import { normalizeQuaternion, multiplyQuaternion } from './trackball.mjs';

/** Simulated viewport transform; not a calibrated yarn or force model.
 * Two stable, ordered pointer pairs are required. No mutation or side effects.
 */
export function applyPinchTrackball(orientation, previous, current, options = {}) {
  const initial = normalizeQuaternion(orientation);
  const frame = pinchFrame(previous, current, options);
  if (!frame.valid) return Object.freeze({ orientation: Object.freeze(initial), ...frame, simulated: true });
  const half = frame.rotation / 2;
  const twist = [Math.cos(half), 0, 0, Math.sin(half)];
  const next = multiplyQuaternion(twist, initial);
  return Object.freeze({ orientation: Object.freeze(next), ...frame, simulated: true });
}
